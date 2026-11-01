# Development

How to run Portfolio locally and check a change. For deploying, see [deployment/](../deployment/README.md).

## Prerequisites

- Python 3.13 and [Poetry](https://python-poetry.org/) (the version is pinned by `.python-version`)
- Node.js and npm
- [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local) (`func`) and Azurite, to run `mcp-tools/` locally
- [honcho](https://github.com/nickstenning/honcho) to start everything at once: `pipx install honcho` (one-time; installed globally because there is no repo-root Python project to add it to)
- `az login`, because Azure SQL access uses Microsoft Entra ID instead of a password

## Environment variables

Backend values go in `Portfolio/.env` (the repo root, not a file inside `backend/`). It is gitignored.

| Variable | Used by | Notes |
|---|---|---|
| `OPENAI_API_KEY` | backend | Chat model and moderation API. Required at startup. |
| `FUNCTION_APP_URL` | backend | The `mcp-tools` Function App. Required at startup; locally `http://localhost:7071`. |
| `FUNCTION_MCP_KEY` | backend | Optional locally; required once the Function App enforces its function key in Azure. |
| `AZURE_SQL_SERVER`, `AZURE_SQL_DATABASE` | backend | Chat logging. No password: Microsoft Entra ID auth. |
| `azure_search_endpoint`, `azure_index_name`, `azure_search_api_key` | `mcp-tools/`, `data/` | Not backend variables. `mcp-tools/` uses them for the vector query behind `retrieve_information`, and `data/` uses them to build the index. |

The frontend reads `BACKEND_URL` from `frontend/.env` (gitignored). `server.js` reads it at runtime, not the browser bundle. Set it to `http://localhost:8000` for local runs. When deployed, it defaults to `http://ca-portfolio-backend`, which Bicep sets.

## Run everything

From the repo root:

```bash
honcho start        # Ctrl-C stops all four
```

The `Procfile` starts Azurite, `mcp-tools` (`func start`), the backend and the frontend. Two details matter if you edit it:

- It pins `PORT` explicitly on the `backend` and `frontend` lines. Otherwise honcho assigns its own `PORT` to each process (a Foreman convention), which collides with the defaults in `main.py` and `server.js`.
- The `backend` line waits until `func start` has actually bound `:7071`, not just printed its banner, using a `curl` and `sleep` poll loop.

## Run one service

```bash
# Frontend (frontend/)
npm install
npm run dev          # Vite dev server
npm run build        # production build
npm start            # serve the production build with Express

# Backend (backend/)
poetry install
poetry run uvicorn main:app --reload   # port 8000
poetry run python main.py              # production server
```

`backend/` and `data/` are separate Poetry projects, each with its own `pyproject.toml` and `poetry.lock`. They cannot share one environment because they pin conflicting `tiktoken` versions. `mcp-tools/` uses a plain virtualenv and `requirements.txt`, as Azure Functions Core Tools expects.

## Database

`backend/sql/schema.sql` defines the `chatbot_logs` table, and `backend/scripts/init_azure_sql.py` applies it. It is idempotent, so it is safe to re-run. `backend/sql/grant_identity.sql` is a one-time, manually run statement that grants the deployed container app's managed identity write access to the database. No script runs it, because re-running `CREATE USER` on an existing user errors.

## Search index (`data/`)

The scripts that build the Azure AI Search index have heavier dependencies than the backend needs, so `data/` is its own Poetry project. This keeps those dependencies out of the production container image. Do not merge them into `backend/pyproject.toml`.

```bash
cd data
poetry install
poetry run python populate_index.py    # process documents and upload to the index
```

- `DocumentProcessor.py` converts `.txt`, `.docx` and `.pdf` documents to chunks using MarkItDown. It splits on Markdown headers first and falls back to a recursive splitter if headers give oversized chunks.
- `IndexCreator.py` creates the Azure AI Search index and uploads embeddings.
- `populate_index.py` is the entry point. It reads source documents from a `cw/` directory.

## Checks

Backend, from `backend/`:

```bash
poetry run pytest -v
poetry run ruff check ../backend ../data ../mcp-tools ../scripts ../e2e_backend
poetry run ruff format --check ../backend ../data ../mcp-tools ../scripts ../e2e_backend
poetry run pyright                     # backend/ only
```

Frontend, from `frontend/`:

```bash
npm test        # vitest (jsdom + Testing Library); pretest syncs content
npm run lint    # eslint
npm run build
```

`mcp-tools/` tests run in their own virtualenv, from `mcp-tools/`: copy `content/site-content.json` to `mcp-tools/content/`, run `pip install -r requirements.txt pytest==9.1.1`, then `python -m pytest tests -v`.

The deploy scripts have tests too: `python -m pytest scripts/tests -v` (needs only pytest).

### Browser tests

From `frontend/`: `npm run e2e`. The first time, run `npx playwright install chromium` and `poetry install` in `backend/`. It builds the frontend, then Playwright starts three servers and runs every test offline:

- `e2e_backend.mcp_server` on 8211: the real `mcp-tools/function_app.py` handlers behind a small `azure.functions` shim, over MCP streamable HTTP at `/runtime/webhooks/mcp`, requiring `x-functions-key`. Only Azure AI Search is stubbed.
- `e2e_backend.backend_server` on 8210: the real `main.create_app` and `agent.build_graph` with a scripted model (`e2e_backend/model.py`, keyword script in `script.py`), a fake moderation client (flags `forbidden-topic`) and a recording SQL logger. Test-only routes: `GET /__model_calls`, `GET /__db_log`, `POST /__reset`, `POST /__fail` (next model call raises).
- `server.js` on 3210 with `BACKEND_URL` only (so its production `AGENT_URL` default is used) and raised rate limits.

Projects:

- `server`: each test spawns its own `server.js` at production settings (redirect, headers, both rate limits).
- `full-stack`: browser and AG-UI protocol tests.
- `a11y`: axe on `/` and `/privacy-policy` with every rule on, once entrance animations have finished. Fails on serious or critical issues.

Tests run one at a time because they share the backend's call log. CSS locators live in `e2e/selectors.js`, and ESLint rejects `.locator(` in spec files. `e2e_backend/` sits outside `backend/` because the backend image copies all of `backend/`. A new test must catch a bug that no other test (vitest, pytest or e2e) catches.

### CI

`.github/workflows/ci.yml` runs all of the above on every pull request, and on nothing else (a push to `main` runs no CI). A first job, `changes`, runs `scripts/changed-areas.sh`; a PR that touches only Markdown files in the repository root, `docs/` or `deployment/` skips the rest (Markdown elsewhere, such as `backend/agent/system_prompt.md`, is runtime input and counts as code). Otherwise it runs five checks: `backend` (pytest, ruff, pyright), `mcp-tools-test`, `deploy-scripts-test`, `frontend` (vitest, eslint, build) and `e2e`. CI is draft-first: a push to a draft PR runs only the light jobs; `e2e` and the frontend production build run once the PR is marked ready (`gh pr ready`), together with the AI review. A skipped job counts as passing for the required checks (list: `CLAUDE.md`), but GitHub does not merge a draft, and a ready PR runs `e2e`. `./scripts/ci-local.sh` runs every check CI runs, in the same order; get it green before `gh pr ready`. Images are built by the **Deploy apps** workflow, not by CI (see [deployment/github.md](../deployment/github.md)).

Security scans live in `.github/workflows/security.yml`; jobs, what blocks and local commands: `CLAUDE.md`, "Security checks".

## Making a change

1. Branch from `origin/main`.
2. Run the checks for what you touched; `npm run e2e` when behavior crosses the frontend, backend and tools.
3. `./scripts/ci-local.sh` green, open the PR as a draft, then `gh pr ready`. The AI review skips drafts.
4. After merge, deploy by hand when needed: [deployment/README.md](../deployment/README.md).
