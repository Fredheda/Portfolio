#!/usr/bin/env bash
# Regenerate mcp-tools/requirements.txt: an exact pin for the Function App's
# direct dependencies and everything they pull in. No hashes.
#
# pip itself resolves the set (`pip install --dry-run --report`, nothing is
# installed), under a 14-day window (PIP_UPLOADED_PRIOR_TO) and for the Function
# App's runtime: Linux x86-64 wheels, Python 3.13, whatever machine runs this.
# The pip version is the backend image's (backend/Dockerfile); a guard test keeps
# the two equal.
#
# The committed file is the source of versions: it is passed as a constraint, so
# a pinned package keeps its version (also after a Dependabot bump), a new
# dependency comes from the window and one no longer needed drops out. The
# direct requirements below are floors only. `--upgrade` refreshes everything
# under the window instead.
#
# Run it on purpose, review the diff, open a PR.
#
# Usage: ./scripts/compile-mcp-tools-requirements.sh [--upgrade]
set -euo pipefail

cd "$(dirname "$0")/.."

# Direct dependencies of the Function App, as floors: the only place they live.
DIRECT=(
  "azure-functions>=1.25.0"
  "azure-search-documents>=11.6.0"
  "azure-core>=1.41.0"
  "openai>=2.54.0"
)

# Only files uploaded at least 14 days ago; the window is a constant, not an argument.
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
