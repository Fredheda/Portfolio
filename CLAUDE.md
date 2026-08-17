# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal portfolio website for Frederik Heda (Senior ML Engineer), live at
[frederikheda.com](https://frederikheda.com). It consists of:
- **Frontend**: React + Vite + Tailwind CSS, deployed to Azure Container Apps (`ca-portfolio-web`), bound to the custom domain with a free managed TLS certificate
- **Backend**: FastAPI (Python), deployed to Azure Container Apps (`ca-portfolio-backend`)
- **Data pipeline**: Standalone scripts for building the Azure AI Search index used by RAG

## Commands

### Frontend (`cd frontend`)
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm start            # Serve production build (Express)
```

### Backend (`cd backend`)
```bash
poetry install                     # Install dependencies (Python 3.13, pinned by .python-version)
poetry run uvicorn main:app --reload   # Run dev server (port 8000)
poetry run python main.py          # Run production server
```

### Data Pipeline (`cd data`)
```bash
poetry install                     # Install dependencies (Python 3.13, pinned by .python-version)
poetry run python populate_index.py    # Process documents and upload to Azure AI Search index
```

Dependencies for `backend/` and `data/` are managed by separate Poetry projects (`pyproject.toml` + `poetry.lock` in each), not a shared venv — `backend` and `data` pin conflicting `tiktoken` versions, so they can't share one.

### Deployment
```bash
./scripts/ship.sh
```

## Architecture

### Frontend
Single-page app with React Router. Two routes: `/` (main portfolio) and `/privacy-policy`. The `Chatbot` component renders globally (outside routes) as a floating widget. Components: `Header`, `About`, `Projects`, `Footer`, `Chatbot`, `PrivacyPolicy`.

`server.js` (the production Express server, not Vite) also handles: an application-level 301 redirect from `www.frederikheda.com` to `https://frederikheda.com` (apex is canonical), the `/api/chatbot` proxy to the backend, and security headers (HSTS, X-Frame-Options, etc). Both `frederikheda.com` and `www.frederikheda.com` are bound as custom domains on `ca-portfolio-web` with free Azure-managed certificates — see `docs/Portfolio/plans/2026-08-09-azure-migration.md` Task 7 for the DNS/binding setup if it ever needs redoing (e.g. cert renewal issues, DNS provider migration).

### Backend
FastAPI app with a single POST endpoint `/chatbot` (rate-limited to 5/minute per IP). Request flow:
1. `ContentSafetyService` (Azure OpenAI) screens the user input
2. `rag_client.generate_rag_response()` is called
3. `PromptManager` assembles messages from `.txt` prompt files configured in `LLM/prompts/config.json`
4. `ragClient` calls OpenAI with tool support — if the model calls the `retrieve_information` tool, `llm_utils` performs a vector search against Azure AI Search and appends retrieved context to messages
5. Final OpenAI call produces the answer; interaction is logged to Azure SQL via `database_client` (fire-and-forget, background thread)

### LLM Layer (`backend/LLM/`)
- `LLMClient` — abstract base class
- `OpenAIClient` — concrete implementation using `gpt-4.1-nano` via the Responses API (`client.responses.create`), embeddings via `text-embedding-3-large`
- `PromptManager` — loads all prompts from `.txt` files at startup using `LLM/prompts/config.json` as a manifest; assembles them into a base prompt via Python `string.Template`
- `ToolOrchestrator` — loads tool definitions from JSON files (e.g. `LLM/tools/retrieve_information.json`)
- `llm_utils` — wraps Azure AI Search vector queries (k=5 nearest neighbors on the `embedding` field)

### Data Pipeline (`data/`)
- `DocumentProcessor` — converts `.txt`, `.docx`, `.pdf` files into chunks; uses `MarkdownHeaderTextSplitter` first, falls back to `RecursiveCharacterTextSplitter` (5000 tokens, 500 overlap) if headers produce oversized chunks
- `IndexCreator` — creates/manages the Azure AI Search index and uploads embeddings
- `populate_index.py` — entry point; reads source documents from a `cw/` directory

## MCP Servers and Skills

Always prefer up-to-date external sources over training knowledge when working on this codebase. Apply the following by default:

- **context7** (`mcp__context7__resolve-library-id` + `mcp__context7__query-docs`): Use for any library or framework used in this project — React, Vite, Tailwind, FastAPI, OpenAI SDK, Azure SDK, LangChain, etc. Fetch current docs before writing or modifying code that touches these libraries.
- **Microsoft Learn** (`microsoft_docs_search`, `microsoft_docs_fetch`, `microsoft_code_sample_search`): Use when working with Azure AI Search, Azure OpenAI, or any other Azure/Microsoft service. Prefer this over recalled knowledge for API shapes, SDK versions, and configuration options.
- **`claude-api` skill**: Use when touching the OpenAI Responses API integration (`backend/LLM/openai_client.py`) or adding new LLM features. The skill provides current Anthropic/OpenAI SDK guidance and best practices.
- **`frontend-design` skill**: Use when making UI changes to keep the frontend quality high.

The rule of thumb: if you are about to write code that calls an external library or cloud API, fetch its current docs first.

## Environment Variables

**Backend** (set via the repo-root `.env` (local) or Container Apps env vars (deployed, via `infra/deploy.sh`)):
- `OPENAI_API_KEY`
- `azure_search_endpoint`, `azure_index_name`, `azure_search_api_key`
- `AZURE_SQL_SERVER`, `AZURE_SQL_DATABASE` — no password, Microsoft Entra ID auth (see `docs/Portfolio/specs/2026-08-09-azure-migration-design.md`)

**Frontend**: `BACKEND_URL` — read by `server.js` (Node), not the browser bundle. Defaults to `http://ca-portfolio-backend` (the in-environment Container Apps address, set by Bicep); for local `npm start` testing against a local backend, set it to `http://localhost:8000`.
