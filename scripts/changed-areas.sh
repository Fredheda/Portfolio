#!/usr/bin/env bash
# Markdown outside the root is code: backend/agent/system_prompt.md is runtime input.
set -euo pipefail

base=${1:?usage: changed-areas.sh <base-ref>}
if ! git rev-parse --verify --quiet "$base^{commit}" >/dev/null; then
  echo "ERROR: base ref '$base' is not a commit; fetch it first." >&2
  exit 1
fi

code=false
data=false
while IFS= read -r path; do
  case "$path" in
    docs/* | deployment/*) ;;
    data/* | .github/workflows/* | scripts/*)
      code=true
      data=true
      ;;
    */*) code=true ;;
    *.md) ;;
    *) code=true ;;
  esac
done < <(git diff --name-only "$base"...HEAD)

echo "code=$code"
echo "data=$data"
