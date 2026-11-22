#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

FUNCTION_APP_NAME=func-portfolio-mcp-tools

mkdir -p mcp-tools/content
cp content/site-content.json mcp-tools/content/site-content.json

cd mcp-tools
func azure functionapp publish "$FUNCTION_APP_NAME" --python
