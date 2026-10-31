#!/usr/bin/env bash
# Build both images natively on linux/amd64 with ACR Tasks and push
# :latest + :<git-sha>. Auth: the caller's live `az login` session (or the
# GitHub build identity) — no stored credentials. The upload honors
# .dockerignore, so .env stays out.
#
# An image that already exists for the commit is skipped, so running the build
# again for a commit (a second Deploy, a rollback, ship.sh) is a no-op.
#
# With a SHA argument, that commit is exported with `git archive` into a
# temporary directory and built from there, so the image is exactly the
# committed code whatever the working tree holds. This is how the Deploy apps
# workflow builds. Without an argument it builds HEAD from the working tree
# (ship.sh, which refuses a dirty tree first, so the :<git-sha> tag is honest).
#
# Usage: ./scripts/build-push.sh [FULL_SHA]
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib/images.sh
source scripts/lib/images.sh

if [ $# -gt 0 ]; then
  SHA=$1
  if ! is_sha "$SHA"; then
    echo "ERROR: '$SHA' is not a full 40-character lowercase commit SHA." >&2
    exit 1
  fi
  if ! git cat-file -e "$SHA^{commit}" 2>/dev/null; then
    echo "ERROR: $SHA is not a commit in this repository." >&2
    exit 1
  fi
  SRC=$(mktemp -d)
  trap 'rm -rf "$SRC"' EXIT
  git archive "$SHA" | tar -x -C "$SRC"
else
  SHA=$(git rev-parse HEAD)
  SRC=$PWD
fi

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
    mkdir -p "$SRC/frontend/content"
    cp "$SRC/content/site-content.json" "$SRC/frontend/content/site-content.json"
  fi
  (cd "$SRC" && az acr build --registry "$ACR" --file "$dockerfile" \
    --image "$repo:latest" --image "$repo:$SHA" "$context")
  built+=("$repo")
done

if [ "${#built[@]}" -eq 0 ]; then
  echo "Nothing to build: all images already exist at $SHA"
else
  echo "Pushed ${built[*]} at $SHA"
fi
