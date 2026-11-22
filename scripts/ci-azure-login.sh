#!/usr/bin/env bash
# The azure/login action does the same exchange; the repo allows only a short list of actions.
set -euo pipefail

client_id="${1:?usage: ci-azure-login.sh <client-id>}"
: "${AZURE_TENANT_ID:?AZURE_TENANT_ID is not set}"
: "${AZURE_SUBSCRIPTION_ID:?AZURE_SUBSCRIPTION_ID is not set}"

if [ -z "${ACTIONS_ID_TOKEN_REQUEST_URL:-}" ] || [ -z "${ACTIONS_ID_TOKEN_REQUEST_TOKEN:-}" ]; then
  echo "ERROR: no GitHub OIDC token endpoint; the job needs 'permissions: id-token: write'." >&2
  exit 1
fi

token=$(curl -sSfG -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
  --data-urlencode "audience=api://AzureADTokenExchange" \
  "$ACTIONS_ID_TOKEN_REQUEST_URL" | jq -r .value)
if [ -z "$token" ] || [ "$token" = "null" ]; then
  echo "ERROR: GitHub returned no OIDC token." >&2
  exit 1
fi
echo "::add-mask::$token"

az login --service-principal -u "$client_id" -t "$AZURE_TENANT_ID" \
  --federated-token "$token" --allow-no-subscriptions --output none
az account set --subscription "$AZURE_SUBSCRIPTION_ID"
echo "Logged in to Azure as managed identity $client_id"
