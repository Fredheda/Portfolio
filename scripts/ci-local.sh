#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

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
rm -rf mcp-tools/.venv
# The pinned azure-functions needs Python 3.13: use the backend's interpreter, not the PATH's.
(cd backend && poetry run python -m venv ../mcp-tools/.venv)
mcp-tools/.venv/bin/pip install pip==26.2.2
mcp-tools/.venv/bin/pip install --no-deps --only-binary=":all:" -r mcp-tools/requirements.txt
mcp-tools/.venv/bin/pip check
PIP_UPLOADED_PRIOR_TO=P14D mcp-tools/.venv/bin/pip install pytest==9.1.1
(
  cd mcp-tools
  .venv/bin/python -m pytest tests -v
)

step "data: tests (offline, no index, no embeddings)"
(
  cd data
  poetry install --no-root --no-interaction
  poetry run pytest -v
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
