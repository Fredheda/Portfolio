# Portfolio Backend

FastAPI backend for the portfolio site's RAG chatbot (`/chatbot`), deployed to Heroku.

## Development

```bash
poetry install
poetry run uvicorn main:app --reload
```

Requires a `.env` with `OPENAI_API_KEY`, `REACT_APP_FRONTEND_URL`, `azure_search_endpoint`, `azure_index_name`, `azure_search_api_key`, and `DATABASE_URL` — see the repo root `CLAUDE.md` for details.

## Deployment

```bash
git subtree push --prefix backend heroku main
```

Dependencies are managed by Poetry (`pyproject.toml` + `poetry.lock`, Python 3.13 pinned by `.python-version`). Heroku's Python buildpack auto-detects `poetry.lock` and runs `poetry sync --only main` — no other build config is needed.
