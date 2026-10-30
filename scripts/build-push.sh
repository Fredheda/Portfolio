#!/usr/bin/env bash
# Build both images natively on linux/amd64 with ACR Tasks and push
# :latest + :<git-sha>. Auth: the caller's live `az login` session (or the
# GitHub build identity) — no stored credentials. The upload honors
# .dockerignore, so .env stays out.
#
# An image that already exists for this commit is skipped, so re-running the
# build for a commit (a CI re-run, or ship.sh after a CI build) is a no-op.
#
# NOTE: az acr build builds the WORKING TREE, not the committed SHA. Run it
# with a clean tree so the :<git-sha> tag is honest.
#
# Usage: ./scripts/build-push.sh
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib/images.sh
source scripts/lib/images.sh

SHA=$(git rev-parse HEAD)

built=()
for entry in "${IMAGES[@]}"; do
  IFS='|' read -r repo _ dockerfile context <<<"$entry"
  if image_exists "$repo" "$SHA"; then
    echo "Skipping $repo: $SHA already built."
    continue
  fi
  if [ "$repo" = portfolio-web ]; then
    # frontend/'s components import the canonical content file from
    # frontend/content/ (gitignored) — az acr build's context is frontend/
    # alone, so that copy has to happen before packaging, same as
    # deploy-mcp-tools.sh does for mcp-tools/content/.
    mkdir -p frontend/content
    cp content/site-content.json frontend/content/site-content.json
  fi
  az acr build --registry "$ACR" --file "$dockerfile" \
    --image "$repo:latest" --image "$repo:$SHA" "$context"
  built+=("$repo")
done

if [ "${#built[@]}" -eq 0 ]; then
  echo "Nothing to build: all images already exist at $SHA"
else
  echo "Pushed ${built[*]} at $SHA"
fi
