#!/usr/bin/env bash
# With a SHA, the commit is built from `git archive`, not the working tree. Without one,
# HEAD is built from the working tree: ship.sh refuses a dirty tree first so the tag is honest.
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
    # The build context is frontend/ alone, so the gitignored content copy must exist first.
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
