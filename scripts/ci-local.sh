#!/usr/bin/env bash
# Run every check .github/workflows/ci.yml runs, in the same order, and stop at
# the first failure. This is the gate before `gh pr ready`: a draft PR runs
# only the light CI jobs, so make this green first.
#
# Needs Poetry, Python 3, Node 24 and network access for installs. The e2e
# suite itself runs offline. scripts/tests/test_ci_local.py fails when ci.yml
# gains a command this script lacks.
#
# Usage: ./scripts/ci-local.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# macOS and some Linux installs only ship python3.
command -v python >/dev/null 2>&1 || python() { python3 "$@"; }

step() { printf '\n==> %s\n' "$1"; }

step "backend: tests, lint, types"
(
  cd backend
  poetry install --no-interaction
  poetry run pytest -v
  poetry run ruff check ../backend ../data ../mcp-tools ../scripts ../e2e_backend
  poetry run ruff format --check ../backend ../data ../mcp-tools ../scripts ../e2e_backend
  poetry run pyright
)

step "mcp-tools tests (isolated venv)"
mkdir -p mcp-tools/content && cp content/site-content.json mcp-tools/content/site-content.json
python -m venv mcp-tools/.venv
mcp-tools/.venv/bin/pip install -r mcp-tools/requirements.txt pytest==9.1.1
(
  cd mcp-tools
  .venv/bin/python -m pytest tests -v
)

step "deploy and CI script tests"
python -m pytest scripts/tests -v

step "frontend: tests, lint, production build"
(
  cd frontend
  npm ci --ignore-scripts
  npm test
  npm run lint
  npm run build
)

step "e2e (Playwright, offline)"
(
  cd frontend
  npx playwright install chromium
  npm run e2e
)

printf '\nAll CI checks passed locally.\n'
