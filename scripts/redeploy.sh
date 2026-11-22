#!/usr/bin/env bash
# Image-only: no Bicep run. Both images must exist before any app rolls, so a half-built
# commit cannot leave mixed versions. Deployed tags are locked (`acr purge` skips them) and
# the replaced ones unlocked, only after every rollout succeeds.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib/images.sh
source scripts/lib/images.sh

SHA="${1:-$(git rev-parse HEAD)}"
if ! is_sha "$SHA"; then
  echo "ERROR: '$SHA' is not a full 40-character commit SHA." >&2
  exit 2
fi
echo "Deploying images for commit $SHA"

missing=0
for entry in "${IMAGES[@]}"; do
  IFS='|' read -r repo _ _ _ <<<"$entry"
  if ! image_exists "$repo" "$SHA"; then
    echo "ERROR: image $repo:$SHA is not in $ACR (build for this commit missing or unfinished)." >&2
    missing=1
  fi
done
[ "$missing" -eq 0 ] || exit 1

old_tags=()
for entry in "${IMAGES[@]}"; do
  IFS='|' read -r _ app _ _ <<<"$entry"
  current=$(az containerapp show -n "$app" -g "$RG" \
    --query "properties.template.containers[0].image" -o tsv)
  old_tags+=("${current##*:}")
done

for entry in "${IMAGES[@]}"; do
  IFS='|' read -r repo app _ _ <<<"$entry"
  az containerapp update -n "$app" -g "$RG" \
    --image "$ACR.azurecr.io/$repo:$SHA" --output none
done

status=0
i=0
for entry in "${IMAGES[@]}"; do
  IFS='|' read -r repo _ _ _ <<<"$entry"
  lock_tag "$repo" "$SHA" || { echo "ERROR: could not lock $repo:$SHA" >&2; status=1; }
  old="${old_tags[$i]}"
  if is_sha "$old" && [ "$old" != "$SHA" ]; then
    unlock_tag "$repo" "$old" || { echo "ERROR: could not unlock $repo:$old" >&2; status=1; }
  fi
  i=$((i + 1))
done
if [ "$status" -ne 0 ]; then
  echo "The apps ARE rolled to $SHA; only the tag locking failed. Fix it with" >&2
  echo "az acr repository update --image <repo>:<tag> --delete-enabled false." >&2
  exit "$status"
fi

FQDN=$(az containerapp show -n ca-portfolio-web -g "$RG" \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "Deployed. https://$FQDN"
