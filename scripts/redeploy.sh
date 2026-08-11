#!/usr/bin/env bash
# Roll both container apps to the images built from a given commit.
# Usage: ./scripts/redeploy.sh [git-sha]   (defaults to current HEAD — the
# same commit ./scripts/build-push.sh tags)
#
# Image-only: no Bicep re-run, no secret prompts. Use after build-push.sh
# to promote freshly-built images. SHA tags (not `latest`) so every deploy
# creates a distinct revision — rollback is `./scripts/redeploy.sh <old-sha>`.
set -euo pipefail

RG=rg-chatbot
SHA="${1:-$(git rev-parse HEAD)}"
[ -n "$SHA" ] || { echo "ERROR: could not resolve a SHA" >&2; exit 1; }
echo "Deploying images for commit $SHA"

az containerapp update -n ca-portfolio-backend -g "$RG" \
  --image "acrchatbotfredheda.azurecr.io/portfolio-backend:$SHA" --output none
az containerapp update -n ca-portfolio-web -g "$RG" \
  --image "acrchatbotfredheda.azurecr.io/portfolio-web:$SHA" --output none

FQDN=$(az containerapp show -n ca-portfolio-web -g "$RG" \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "Deployed. https://$FQDN"
