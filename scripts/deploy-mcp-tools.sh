#!/usr/bin/env bash
# Publish the MCP tools Function App's code (infra/deploy.sh provisions the
# Function App resource itself — this script only ships code to it). The
# companion to ./scripts/ship.sh, which covers frontend/backend Container
# Apps but never touches this Function App. Requires the `func` CLI (Azure
# Functions Core Tools) installed locally. See Deployment.md for the full
# picture of all three deploy targets.
# Usage: ./scripts/deploy-mcp-tools.sh
set -euo pipefail
cd "$(dirname "$0")/.."

FUNCTION_APP_NAME=func-portfolio-mcp-tools

# Copy the canonical content file into the function package before publishing
# (single source of truth lives at Portfolio/content/, not duplicated by hand).
mkdir -p mcp-tools/content
cp content/site-content.json mcp-tools/content/site-content.json

cd mcp-tools
func azure functionapp publish "$FUNCTION_APP_NAME" --python
