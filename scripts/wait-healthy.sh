#!/usr/bin/env bash
# Checks the new revision's own state: a freshly updated app can keep serving from its
# previous revision for a while. Never rolls back; that is a deliberate redeploy.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib/images.sh
source scripts/lib/images.sh

timeout="${1:-300}"
interval="${2:-5}"
deadline=$((SECONDS + timeout))

for entry in "${IMAGES[@]}"; do
  IFS='|' read -r _ app _ _ <<<"$entry"
  revision=$(az containerapp show -n "$app" -g "$RG" \
    --query properties.latestRevisionName -o tsv)
  while true; do
    state=$(az containerapp revision show -n "$app" -g "$RG" \
      --revision "$revision" --query properties.provisioningState -o tsv)
    case "$state" in
      Provisioned)
        echo "$app: $revision is Provisioned"
        break ;;
      Failed)
        echo "ERROR: $app revision $revision failed to provision." >&2
        exit 1 ;;
    esac
    if [ "$SECONDS" -ge "$deadline" ]; then
      echo "ERROR: timed out after ${timeout}s waiting for $app revision $revision (state: $state)." >&2
      exit 1
    fi
    sleep "$interval"
  done
done
