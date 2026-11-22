#!/usr/bin/env bash
# Without --create: locks the running tags, then prints a purge DRY RUN to read first.
# `acr purge` deletes permanently and is a preview feature; --include-locked is never used.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib/images.sh
source scripts/lib/images.sh

TASK=purge-portfolio-images
SCHEDULE="0 3 * * Sun"
AGO=30d
KEEP=10

create=0
case "${1:-}" in
  "") ;;
  --create) create=1 ;;
  *) echo "usage: $0 [--create]" >&2; exit 2 ;;
esac

for entry in "${IMAGES[@]}"; do
  IFS='|' read -r repo app _ _ <<<"$entry"
  current=$(az containerapp show -n "$app" -g "$RG" \
    --query "properties.template.containers[0].image" -o tsv)
  tag="${current##*:}"
  if is_sha "$tag"; then
    lock_tag "$repo" "$tag"
    echo "locked $repo:$tag (running in $app)"
  else
    echo "not locking $repo: $app runs '$current', not a SHA tag"
  fi
done

purge="acr purge"
for entry in "${IMAGES[@]}"; do
  IFS='|' read -r repo _ _ _ <<<"$entry"
  purge+=" --filter '$repo:^[0-9a-f]{40}\$'"
done
purge+=" --ago $AGO --keep $KEEP --untagged"

echo
echo "Dry run (nothing is deleted):"
az acr run --registry "$ACR" --cmd "$purge --dry-run" /dev/null

if [ "$create" -eq 0 ]; then
  echo
  echo "Review the list above. If it only names old SHA tags of portfolio-* repositories,"
  echo "create the weekly task with: ./scripts/setup-acr-purge.sh --create"
  exit 0
fi

if az acr task show -n "$TASK" -r "$ACR" -o none 2>/dev/null; then
  az acr task delete -n "$TASK" -r "$ACR" --yes
fi
az acr task create -n "$TASK" -r "$ACR" --cmd "$purge" \
  --schedule "$SCHEDULE" --context /dev/null --output none
echo "Task $TASK created: $SCHEDULE UTC, tags older than $AGO, newest $KEEP kept."
