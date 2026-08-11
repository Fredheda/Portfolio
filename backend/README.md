# Portfolio Backend

FastAPI backend for the portfolio site's RAG chatbot (`/chatbot`), deployed
to Azure Container Apps as `ca-portfolio-backend` (internal ingress only —
not reachable from the public internet directly; the frontend proxies to it).

## Development

```bash
poetry install
poetry run uvicorn main:app --reload
```

Requires the repo-root `.env` (`Portfolio/.env`, not a file inside
`backend/`) with `OPENAI_API_KEY`, `azure_search_endpoint`,
`azure_index_name`, `azure_search_api_key`, `AZURE_SQL_SERVER`, and
`AZURE_SQL_DATABASE`. Azure SQL auth is passwordless (Microsoft Entra ID via
`az login` locally) — no SQL password anywhere. See the repo root
`CLAUDE.md` for details.

## Deployment

```bash
./scripts/ship.sh
```

Run from the `Portfolio/` repo root. See `Portfolio/Deployment.md` for the
full deploy/rollback workflow.

Dependencies are managed by Poetry (`pyproject.toml` + `poetry.lock`, Python
3.13 pinned by `.python-version`). The container image is built from
`backend/Dockerfile` via `az acr build` — no local Docker required.
