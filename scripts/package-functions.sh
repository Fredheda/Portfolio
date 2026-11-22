#!/usr/bin/env bash
# Reads nothing from the current directory, so it packages commits older than this script.
set -euo pipefail

src="${1:?usage: package-functions.sh SRC_ROOT OUT_ZIP}"
out="${2:?usage: package-functions.sh SRC_ROOT OUT_ZIP}"

if [ ! -d "$src/mcp-tools" ]; then
  echo "ERROR: $src/mcp-tools does not exist." >&2
  exit 1
fi
if [ ! -f "$src/content/site-content.json" ]; then
  echo "ERROR: $src/content/site-content.json does not exist." >&2
  exit 1
fi

mkdir -p "$(dirname "$out")"
out="$(cd "$(dirname "$out")" && pwd)/$(basename "$out")"
rm -f "$out"

mkdir -p "$src/mcp-tools/content"
cp "$src/content/site-content.json" "$src/mcp-tools/content/site-content.json"

cd "$src/mcp-tools"
zip -q -r -X "$out" . \
  -x 'local.settings.json*' '*/local.settings.json*' \
  -x 'tests/*' '*/tests/*' \
  -x '__pycache__/*' '*/__pycache__/*' '*.pyc' \
  -x '.gitignore' '*/.gitignore' \
  -x '.venv/*' '.python_packages/*'
echo "Packaged $out"
