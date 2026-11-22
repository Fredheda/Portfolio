#!/usr/bin/env bash
# Needs only git: it runs before the Azure login.
set -euo pipefail

REQUIRED_PATHS=(
  mcp-tools/function_app.py
  mcp-tools/host.json
  mcp-tools/requirements.txt
  content/site-content.json
)

sha="$(printf '%s' "${1:-}" | tr -d '[:space:]')"
if [ -z "$sha" ]; then
  sha="$(git rev-parse --verify 'origin/main^{commit}')"
fi

if ! printf '%s' "$sha" | grep -Eq '^[0-9a-f]{40}$'; then
  echo "ERROR: '$sha' is not a full 40-character commit SHA." >&2
  exit 1
fi
if ! git cat-file -e "$sha^{commit}" 2>/dev/null; then
  echo "ERROR: $sha is not a commit in this repository." >&2
  exit 1
fi
if ! git merge-base --is-ancestor "$sha" origin/main; then
  echo "ERROR: $sha is not on main; only merged commits can be deployed." >&2
  exit 1
fi
for path in "${REQUIRED_PATHS[@]}"; do
  if ! git cat-file -e "$sha:$path" 2>/dev/null; then
    echo "ERROR: $sha has no $path; it predates the function app." >&2
    exit 1
  fi
done

echo "$sha"
