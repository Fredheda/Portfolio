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
        { name: 'azure-search-api-key', value: azureSearchApiKey }
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
            { name: 'azure_search_api_key', secretRef: 'azure-search-api-key' }
            { name: 'azure_search_endpoint', value: azureSearchEndpoint }
            { name: 'azure_index_name', value: azureIndexName }
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
