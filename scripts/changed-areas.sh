#!/usr/bin/env bash
# Decide whether a pull request needs the heavy CI jobs. Prints `code=false`
# when every file the PR changed (added, edited, renamed or deleted) is
# documentation, and `code=true` otherwise. Documentation means a Markdown
# file in the repository root, or anything under docs/ or deployment/. A
# Markdown file anywhere else is code, because some are runtime input
# (backend/agent/system_prompt.md is the model's instructions). Workflow files
# and scripts count as code, so a change to CI itself always runs all of CI.
# An empty diff counts as documentation-only.
#
# A second line, `data=true`, says the PR touches data/, a workflow or a
# script, so the data tests in ci.yml are worth running; otherwise `data=false`.
#
# The `changes` job in ci.yml appends both lines to $GITHUB_OUTPUT.
#
# Usage: ./scripts/changed-areas.sh <base-ref>   (for example origin/main)
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
