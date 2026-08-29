#!/usr/bin/env bash
# Provision (or update) the Container Apps environment + both apps from
# infra/main.bicep. Idempotent — re-run to roll config changes.
#
# Sources the repo-root .env for all secrets (OpenAI key, Azure Search key —
# too many for copilot-kit-exp's one-secret interactive-prompt pattern to
# still be the best UX). Azure SQL access is passwordless (Microsoft Entra
# ID via the identity Bicep creates), so there's no SQL secret to source.
# .env is gitignored and never leaves this machine; auth to Azure is the live
# `az login` session. The registry + resource group already exist; this only
# adds the environment, identity, and the two apps.
#
# Usage: ./infra/deploy.sh [image-tag]
#   image-tag defaults to the current git HEAD SHA (the tag build-push.sh set).
set -euo pipefail
cd "$(dirname "$0")/.."

RG=rg-chatbot
TAG="${1:-$(git rev-parse HEAD)}"
[ -n "$TAG" ] || { echo "ERROR: could not resolve an image tag" >&2; exit 1; }

[ -f .env ] || { echo "ERROR: .env not found at repo root" >&2; exit 1; }
set -a
source .env
set +a

for var in OPENAI_API_KEY azure_search_api_key azure_search_endpoint azure_index_name AZURE_SQL_SERVER AZURE_SQL_DATABASE; do
  [ -n "${!var:-}" ] || { echo "ERROR: $var is empty in .env" >&2; exit 1; }
done

echo "Deploying image tag $TAG to resource group $RG..."
az deployment group create \
  --resource-group "$RG" \
  --template-file infra/main.bicep \
  --parameters imageTag="$TAG" \
    openaiApiKey="$OPENAI_API_KEY" \
    azureSearchApiKey="$azure_search_api_key" \
    azureSearchEndpoint="$azure_search_endpoint" \
    azureIndexName="$azure_index_name" \
    azureSqlServer="$AZURE_SQL_SERVER" \
    azureSqlDatabase="$AZURE_SQL_DATABASE" \
    functionMcpKey="${FUNCTION_MCP_KEY:-}" \
  --query "properties.provisioningState" -o tsv

FQDN=$(az containerapp show -n ca-portfolio-web -g "$RG" \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "Frontend: https://$FQDN"

if [ -z "${FUNCTION_MCP_KEY:-}" ]; then
  echo ""
  echo "FUNCTION_MCP_KEY is unset -- this looks like a first deploy, or a"
  echo "redeploy after recreating the Function App. Next steps:"
  echo "  1. ./scripts/deploy-mcp-tools.sh"
  echo "  2. FUNCTION_MCP_KEY=\$(az functionapp keys list -g $RG -n func-portfolio-mcp-tools --query systemKeys.mcp_extension -o tsv)"
  echo "  3. az containerapp secret set -g $RG -n ca-portfolio-backend --secrets function-mcp-key=\"\$FUNCTION_MCP_KEY\""
  echo "  4. az containerapp update -g $RG -n ca-portfolio-backend --set-env-vars FUNCTION_MCP_KEY=secretref:function-mcp-key"
  echo "  5. Add FUNCTION_MCP_KEY=<value> to .env so future deploys don't need this again"
fi
