#!/usr/bin/env bash
# The Azure IDs are stored as secrets, not variables: a public repo's run logs are public.
set -euo pipefail

GH_REPO=Fredheda/Portfolio
RG=rg-chatbot
LOCATION=westeurope
IDENTITY=id-portfolio-mcp-gh-deploy
FUNCTION_APP=func-portfolio-mcp-tools
ISSUER=https://token.actions.githubusercontent.com

TENANT_ID=$(az account show --query tenantId -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "Subscription $SUBSCRIPTION_ID, repo $GH_REPO"

if az identity show -g "$RG" -n "$IDENTITY" -o none 2>/dev/null; then
  echo "identity $IDENTITY: exists"
else
  az identity create -g "$RG" -n "$IDENTITY" -l "$LOCATION" -o none
  echo "identity $IDENTITY: created"
fi
PRINCIPAL=$(az identity show -g "$RG" -n "$IDENTITY" --query principalId -o tsv)
CLIENT=$(az identity show -g "$RG" -n "$IDENTITY" --query clientId -o tsv)

# By object id and principal type: a just-created identity need not wait for Entra replication.
APP_ID=$(az functionapp show -g "$RG" -n "$FUNCTION_APP" --query id -o tsv)
az role assignment create --assignee-object-id "$PRINCIPAL" \
  --assignee-principal-type ServicePrincipal \
  --role "Website Contributor" --scope "$APP_ID" -o none
echo "role 'Website Contributor' on $FUNCTION_APP: ensured"

CRED=github-production
SUBJECT="repo:$GH_REPO:environment:production"
if az identity federated-credential show -g "$RG" --identity-name "$IDENTITY" \
  --name "$CRED" -o none 2>/dev/null; then
  echo "federated credential $IDENTITY/$CRED: exists"
else
  az identity federated-credential create -g "$RG" --identity-name "$IDENTITY" \
    --name "$CRED" --issuer "$ISSUER" --subject "$SUBJECT" \
    --audiences api://AzureADTokenExchange -o none
  echo "federated credential $IDENTITY/$CRED: created ($SUBJECT)"
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
gh secret set AZURE_DEPLOY_CLIENT_ID --body "$CLIENT" -R "$GH_REPO"
echo "repo secrets: set"
echo "Done. Re-running changes nothing."
