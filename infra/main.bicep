@description('Region for all resources. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Existing Azure Container Registry name (shared with copilot-kit-exp).')
param acrName string = 'acrchatbotfredheda'

@description('Container Apps environment name.')
param environmentName string = 'cae-portfolio'

@description('Backend (FastAPI) container app name.')
param backendAppName string = 'ca-portfolio-backend'

@description('Frontend (Express/Vite) container app name.')
param frontendAppName string = 'ca-portfolio-web'

@description('User-assigned managed identity used for ACR pulls.')
param identityName string = 'id-portfolio-acrpull'

@description('Image tag to deploy for both images (e.g. a git commit SHA).')
param imageTag string

@secure()
param openaiApiKey string

@secure()
param azureSearchApiKey string

param azureSearchEndpoint string
param azureIndexName string

@description('Azure Function App name (MCP tools server).')
param functionAppName string = 'func-portfolio-mcp-tools'

@description('Storage account backing the Function App (name must be globally unique, lowercase, no dashes).')
param functionStorageAccountName string = 'stportfoliomcp'

@secure()
@description('MCP extension system key for the Function App, fetched post-deploy (see infra/deploy.sh). Empty on first deploy.')
param functionMcpKey string = ''

@description('User-assigned managed identity the backend uses to call the blog read API. It holds no Azure role: the only grant is an app role assigned in the blog project (its approve-client script).')
param blogReadIdentityName string = 'id-portfolio-blogread'

@description('Blog read API base URL (https://...). Empty keeps the blog routes off.')
param blogApiUrl string = ''

@description('Blog read API audience, api://<application id>. Needed together with blogApiUrl.')
param blogApiAudience string = ''

var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
var loginServer = '${acrName}.azurecr.io'

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
}

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
}

resource blogReadIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: blogReadIdentityName
  location: location
}

var blogEnv = empty(blogApiUrl) ? [] : [
  { name: 'BLOG_API_URL', value: blogApiUrl }
  { name: 'BLOG_API_AUDIENCE', value: blogApiAudience }
  { name: 'BLOG_READ_CLIENT_ID', value: blogReadIdentity.properties.clientId }
]

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, identity.id, acrPullRoleId)
  scope: acr
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
  }
}

// No appLogsConfiguration on purpose: a Log Analytics destination bills silently.
resource environment 'Microsoft.App/managedEnvironments@2025-01-01' = {
  name: environmentName
  location: location
  properties: {}
}

resource functionStorage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: functionStorageAccountName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

resource functionDeploymentContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${functionStorage.name}/default/deployments'
}

resource functionPlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: '${functionAppName}-plan'
  location: location
  kind: 'functionapp'
  sku: { name: 'FC1', tier: 'FlexConsumption' }
  properties: {
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: functionPlan.id
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${functionStorage.properties.primaryEndpoints.blob}deployments'
          authentication: {
            type: 'StorageAccountConnectionString'
            storageAccountConnectionStringName: 'DEPLOYMENT_STORAGE_CONNECTION_STRING'
          }
        }
      }
      runtime: {
        name: 'python'
        version: '3.13'
      }
      scaleAndConcurrency: {
        maximumInstanceCount: 40
        instanceMemoryMB: 2048
      }
    }
    siteConfig: {
      appSettings: [
        { name: 'AzureWebJobsStorage', value: 'DefaultEndpointsProtocol=https;AccountName=${functionStorage.name};AccountKey=${functionStorage.listKeys().keys[0].value};EndpointSuffix=core.windows.net' }
        { name: 'DEPLOYMENT_STORAGE_CONNECTION_STRING', value: 'DefaultEndpointsProtocol=https;AccountName=${functionStorage.name};AccountKey=${functionStorage.listKeys().keys[0].value};EndpointSuffix=core.windows.net' }
        { name: 'OPENAI_API_KEY', value: openaiApiKey }
        { name: 'azure_search_api_key', value: azureSearchApiKey }
        { name: 'azure_search_endpoint', value: azureSearchEndpoint }
        { name: 'azure_index_name', value: azureIndexName }
      ]
    }
    httpsOnly: true
  }
}

resource backend 'Microsoft.App/containerApps@2025-01-01' = {
  name: backendAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
      '${blogReadIdentity.id}': {}
    }
  }
  dependsOn: [
    acrPull
  ]
  properties: {
    environmentId: environment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 8000
        transport: 'auto'
      }
      registries: [
        {
          server: loginServer
          identity: identity.id
        }
      ]
      secrets: [
        { name: 'openai-api-key', value: openaiApiKey }
        // Container Apps rejects an empty secret value; deploy.sh sets the real key later.
        { name: 'function-mcp-key', value: empty(functionMcpKey) ? 'unset' : functionMcpKey }
      ]
    }
    template: {
      containers: [
        {
          name: 'portfolio-backend'
          image: '${loginServer}/portfolio-backend:${imageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: concat([
            { name: 'OPENAI_API_KEY', secretRef: 'openai-api-key' }
            { name: 'FUNCTION_APP_URL', value: 'https://${functionApp.properties.defaultHostName}' }
            { name: 'FUNCTION_MCP_KEY', secretRef: 'function-mcp-key' }
          ], blogEnv)
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
    }
  }
}

resource frontend 'Microsoft.App/containerApps@2025-01-01' = {
  name: frontendAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  dependsOn: [
    acrPull
    backend
  ]
  properties: {
    environmentId: environment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        // ingress is authoritative on PUT: omitting customDomains drops the production domain binding
        customDomains: [
          {
            name: 'frederikheda.com'
            bindingType: 'SniEnabled'
            certificateId: '${environment.id}/managedCertificates/mc-cae-portfolio-frederikheda-com-0627'
          }
          {
            name: 'www.frederikheda.com'
            bindingType: 'SniEnabled'
            certificateId: '${environment.id}/managedCertificates/mc-cae-portfolio-www-frederikheda-4249'
          }
        ]
      }
      registries: [
        {
          server: loginServer
          identity: identity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'portfolio-web'
          image: '${loginServer}/portfolio-web:${imageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'BACKEND_URL', value: 'http://${backendAppName}' }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
    }
  }
}

output frontendFqdn string = frontend.properties.configuration.ingress.fqdn
output backendFqdn string = backend.properties.configuration.ingress.fqdn
output identityName string = identity.name
output blogReadIdentityClientId string = blogReadIdentity.properties.clientId
output blogReadIdentityPrincipalId string = blogReadIdentity.properties.principalId
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
