// Azure Container Apps deployment for the Portfolio site.
//
// Provisions, into the existing rg-chatbot resource group (shared with
// copilot-kit-exp, along with its ACR — nothing else is shared, this project
// gets its own Container Apps environment: cae-portfolio):
//   - a Container Apps environment (no Log Analytics — same as cae-chatbot)
//   - a user-assigned managed identity granted AcrPull on the EXISTING registry
//   - the backend app  (ca-portfolio-backend): internal ingress only
//   - the frontend app (ca-portfolio-web):     external ingress, public site
//
// No Easy Auth anywhere here — unlike copilot-kit-exp's gated demo, this site
// must stay fully public.
//
// Deploy with infra/deploy.sh (sources the repo-root .env for all secrets —
// there are too many here, three, for one-by-one interactive prompting to
// still be the best UX, unlike copilot-kit-exp's single OpenAI-key prompt).

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

param azureSqlServer string
param azureSqlDatabase string

@description('Azure Function App name (MCP tools server).')
param functionAppName string = 'func-portfolio-mcp-tools'

@description('Storage account backing the Function App (name must be globally unique, lowercase, no dashes).')
param functionStorageAccountName string = 'stportfoliomcp'

@secure()
@description('MCP extension system key for the Function App, fetched post-deploy (see infra/deploy.sh). Empty on first deploy.')
param functionMcpKey string = ''

// Built-in AcrPull role definition ID (constant across all tenants).
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
var loginServer = '${acrName}.azurecr.io'

// The registry already exists (shared with copilot-kit-exp) — reference, don't create.
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
}

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
}

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, identity.id, acrPullRoleId)
  scope: acr
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
  }
}

// No Log Analytics — same reasoning as cae-chatbot: omitting
// appLogsConfiguration entirely avoids the one meter that silently accrues.
// Live logs remain available via `az containerapp logs show --follow`.
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

// Flex Consumption ships code from a blob container rather than
// WEBSITE_RUN_FROM_PACKAGE — this is that deployment target.
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
    // Flex Consumption moves language/version and deployment source out of
    // siteConfig.linuxFxVersion and into this block. 3.13 (unlike on Linux
    // Consumption) is GA here, matching the Python version used everywhere
    // else in this project.
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

// Backend: internal ingress only — no public endpoint. Reachable in-environment
// as http://ca-portfolio-backend (port 80 -> targetPort 8000).
resource backend 'Microsoft.App/containerApps@2025-01-01' = {
  name: backendAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
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
        // Container Apps rejects an empty secret value, so fall back to a
        // placeholder on first deploy (before the real MCP key is known) —
        // infra/deploy.sh's post-deploy steps replace it via `az containerapp
        // secret set` once the Function App's system key can be fetched.
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
          env: [
            { name: 'OPENAI_API_KEY', secretRef: 'openai-api-key' }
            { name: 'FUNCTION_APP_URL', value: 'https://${functionApp.properties.defaultHostName}' }
            { name: 'FUNCTION_MCP_KEY', secretRef: 'function-mcp-key' }
            { name: 'AZURE_SQL_SERVER', value: azureSqlServer }
            { name: 'AZURE_SQL_DATABASE', value: azureSqlDatabase }
            // Presence of this var is what makes database_client.py pick
            // ActiveDirectoryMSI auth (this identity) over ActiveDirectoryDefault.
            { name: 'AZURE_CLIENT_ID', value: identity.properties.clientId }
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

// Frontend: external ingress, public. Talks to the backend over in-environment DNS.
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
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
