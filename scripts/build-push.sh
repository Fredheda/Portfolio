#!/usr/bin/env bash
# Build both images natively on linux/amd64 with ACR Tasks and push
# :latest + :<git-sha>. Auth: the caller's live `az login` session — no
# stored credentials. The upload honors .dockerignore, so .env stays out.
#
# NOTE: az acr build builds the WORKING TREE, not the committed SHA. Run it
# with a clean tree so the :<git-sha> tag is honest.
#
# Usage: ./scripts/build-push.sh
set -euo pipefail
cd "$(dirname "$0")/.."

ACR=acrchatbotfredheda
SHA=$(git rev-parse HEAD)

az acr build --registry "$ACR" --file backend/Dockerfile \
  --image portfolio-backend:latest --image "portfolio-backend:$SHA" backend

# frontend/'s components import the canonical content file from
# frontend/content/ (gitignored) — az acr build's context is frontend/ alone,
# so that copy has to happen before packaging, same as deploy-mcp-tools.sh
# does for mcp-tools/content/.
mkdir -p frontend/content
cp content/site-content.json frontend/content/site-content.json

az acr build --registry "$ACR" --file frontend/Dockerfile \
  --image portfolio-web:latest --image "portfolio-web:$SHA" frontend

echo "Pushed portfolio-backend and portfolio-web at $SHA"
