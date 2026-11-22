#!/usr/bin/env bash
# The deploy identity's AcrPush also lets it push images: the registry is in legacy
# permission mode, which cannot scope pushes by repository.
# The Azure IDs are stored as secrets, not variables: a public repo's run logs are public.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib/images.sh
source scripts/lib/images.sh

GH_REPO=Fredheda/Portfolio
LOCATION=westeurope
BUILD_ID=id-portfolio-gh-build
DEPLOY_ID=id-portfolio-gh-deploy
PULL_ID=id-portfolio-acrpull
ISSUER=https://token.actions.githubusercontent.com

TENANT_ID=$(az account show --query tenantId -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "Subscription $SUBSCRIPTION_ID, repo $GH_REPO"

ensure_identity() {
  local name=$1
  if az identity show -g "$RG" -n "$name" -o none 2>/dev/null; then
    echo "identity $name: exists" >&2
  else
    az identity create -g "$RG" -n "$name" -l "$LOCATION" -o none
    echo "identity $name: created" >&2
  fi
}

# By object id and principal type: a just-created identity need not wait for Entra replication.
ensure_role() {
  local principal=$1 role=$2 scope=$3
  az role assignment create --assignee-object-id "$principal" \
    --assignee-principal-type ServicePrincipal \
    --role "$role" --scope "$scope" -o none
  echo "role '$role' on ${scope##*/}: ensured"
}

ensure_federated_credential() {
  local identity=$1 name=$2 subject=$3
  if az identity federated-credential show -g "$RG" --identity-name "$identity" \
    --name "$name" -o none 2>/dev/null; then
    echo "federated credential $identity/$name: exists"
  else
    az identity federated-credential create -g "$RG" --identity-name "$identity" \
      --name "$name" --issuer "$ISSUER" --subject "$subject" \
      --audiences api://AzureADTokenExchange -o none
    echo "federated credential $identity/$name: created ($subject)"
  fi
}

ensure_identity "$BUILD_ID"
ensure_identity "$DEPLOY_ID"
BUILD_PRINCIPAL=$(az identity show -g "$RG" -n "$BUILD_ID" --query principalId -o tsv)
BUILD_CLIENT=$(az identity show -g "$RG" -n "$BUILD_ID" --query clientId -o tsv)
DEPLOY_PRINCIPAL=$(az identity show -g "$RG" -n "$DEPLOY_ID" --query principalId -o tsv)
DEPLOY_CLIENT=$(az identity show -g "$RG" -n "$DEPLOY_ID" --query clientId -o tsv)

ACR_ID=$(az acr show -n "$ACR" --query id -o tsv)
PULL_ID_RESOURCE=$(az identity show -g "$RG" -n "$PULL_ID" --query id -o tsv)

ensure_role "$BUILD_PRINCIPAL" "AcrPush" "$ACR_ID"
ensure_role "$BUILD_PRINCIPAL" "Container Registry Tasks Contributor" "$ACR_ID"

ensure_role "$DEPLOY_PRINCIPAL" "AcrPush" "$ACR_ID"
ensure_role "$DEPLOY_PRINCIPAL" "Managed Identity Operator" "$PULL_ID_RESOURCE"
for entry in "${IMAGES[@]}"; do
  IFS='|' read -r _ app _ _ <<<"$entry"
  app_id=$(az containerapp show -n "$app" -g "$RG" --query id -o tsv)
  ensure_role "$DEPLOY_PRINCIPAL" "Container Apps Contributor" "$app_id"
done

ensure_federated_credential "$BUILD_ID" github-production \
  "repo:$GH_REPO:environment:production"
ensure_federated_credential "$DEPLOY_ID" github-production \
  "repo:$GH_REPO:environment:production"

if az identity federated-credential show -g "$RG" --identity-name "$BUILD_ID" \
  --name github-main -o none 2>/dev/null; then
  az identity federated-credential delete -g "$RG" --identity-name "$BUILD_ID" \
    --name github-main --yes -o none
  echo "federated credential $BUILD_ID/github-main: deleted"
fi

# The identity trusts any job in `production`, and the `main` check in the workflow file
# is editable by any branch author: the environment itself admits only main, enforced by
# GitHub. Required reviewers need a public repo on the Free plan.
OWNER_ID=$(gh api "users/${GH_REPO%%/*}" --jq .id)
gh api -X PUT "repos/$GH_REPO/environments/production" --input - \
  --jq '"environment " + .name + ": ensured"' <<EOF
{
  "deployment_branch_policy": {"protected_branches": false, "custom_branch_policies": true},
  "reviewers": [{"type": "User", "id": $OWNER_ID}],
  "prevent_self_review": false,
  "can_admins_bypass": false
}
EOF
policies=$(gh api "repos/$GH_REPO/environments/production/deployment-branch-policies" \
  --jq '.branch_policies[].name')
if grep -qx main <<<"$policies"; then
  echo "environment production: branch policy main exists"
else
  gh api -X POST "repos/$GH_REPO/environments/production/deployment-branch-policies" \
    -f name=main -f type=branch --silent
  echo "environment production: branch policy main created"
fi
while IFS= read -r other; do
  { [ -z "$other" ] || [ "$other" = main ]; } && continue
  echo "WARNING: environment production also admits branch '$other'; remove it in Settings > Environments unless intended." >&2
done <<<"$policies"

gh secret set AZURE_TENANT_ID --body "$TENANT_ID" -R "$GH_REPO"
gh secret set AZURE_SUBSCRIPTION_ID --body "$SUBSCRIPTION_ID" -R "$GH_REPO"
gh secret set AZURE_BUILD_CLIENT_ID --body "$BUILD_CLIENT" -R "$GH_REPO"
gh secret set AZURE_APPS_DEPLOY_CLIENT_ID --body "$DEPLOY_CLIENT" -R "$GH_REPO"
echo "repo secrets: set"
echo "Done. Re-running changes nothing."
