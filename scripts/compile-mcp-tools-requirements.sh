#!/usr/bin/env bash
# The committed requirements.txt is passed as a constraint: pins survive, new dependencies
# come from the 14-day window, `--upgrade` ignores it. The pip version must equal the backend
# image's (a guard test checks).
set -euo pipefail

cd "$(dirname "$0")/.."

DIRECT=(
  "azure-functions>=1.25.0"
  "azure-search-documents>=11.6.0"
  "azure-core>=1.41.0"
  "openai>=2.54.0"
)

export PIP_UPLOADED_PRIOR_TO=P14D

# mktemp -d ignores TMPDIR on macOS, so the path is built by hand.
tmp="$(mktemp -d "${TMPDIR:-/tmp}/mcp-tools-reqs.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT

constraints="mcp-tools/requirements.txt"
case "${1:-}" in
  "") ;;
  --upgrade)
    : > "$tmp/no-constraints.txt"
    constraints="$tmp/no-constraints.txt"
    ;;
  *)
    echo "usage: $0 [--upgrade]" >&2
    exit 2
    ;;
esac

python3.13 -m venv "$tmp/venv"
py="$tmp/venv/bin/python"
"$py" -m pip install --quiet pip==26.2.2

"$py" -m pip install --ignore-installed --dry-run --quiet \
  --report "$tmp/report.json" \
  --only-binary=:all: \
  --python-version 3.13 --implementation cp --abi cp313 \
  --platform manylinux_2_28_x86_64 \
  --platform manylinux_2_17_x86_64 \
  --platform manylinux2014_x86_64 \
  --constraint "$constraints" \
  "${DIRECT[@]}"

"$py" scripts/report_to_pins.py "$tmp/report.json" > "$tmp/requirements.txt"
cp "$tmp/requirements.txt" mcp-tools/requirements.txt
echo "Wrote mcp-tools/requirements.txt: $(grep -c '==' mcp-tools/requirements.txt) pins"
