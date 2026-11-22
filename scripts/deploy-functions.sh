#!/usr/bin/env bash
# Flex Consumption accepts only package deployment, and Python needs a remote build.
# The function list can stay empty after the push: a failing list call counts as "not yet".
set -euo pipefail

APP=func-portfolio-mcp-tools
RG=rg-chatbot

zip="${1:?usage: deploy-functions.sh ZIP [TIMEOUT_SECONDS] [INTERVAL_SECONDS]}"
timeout="${2:-300}"
interval="${3:-5}"

if [ ! -f "$zip" ]; then
  echo "ERROR: package $zip does not exist." >&2
  exit 1
fi

if ! az functionapp deployment source config-zip -g "$RG" -n "$APP" \
  --src "$zip" --build-remote true; then
  echo "ERROR: pushing the package to $APP failed." >&2
  exit 1
fi

deadline=$((SECONDS + timeout))
while true; do
  names=$(az functionapp function list -g "$RG" -n "$APP" \
    --query "[].name" -o tsv 2>/dev/null || true)
  if [ -n "$names" ]; then
    while IFS= read -r name; do
      echo "function: $name"
    done <<<"$names"
    exit 0
  fi
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "ERROR: $APP lists no functions ${timeout}s after the deploy." >&2
    exit 1
  fi
  sleep "$interval"
done
