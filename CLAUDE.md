# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> This repo lives inside a multi-repo workspace with its own root `CLAUDE.md`
> (`../CLAUDE.md`, one level up) covering workspace-wide conventions — where
> specs/plans go, the git-narration rule, shared MCP/skill usage. Keep that
> file's per-project facts about this repo (test-suite status, architecture
> pointers, etc.) in sync whenever they drift from what's true here.

**Git:** the user runs all state-changing git operations themselves, including
`push`, `pull`, `fetch`, and merging pull requests (`gh pr merge`, or via the
GitHub UI) — hand over the exact command or PR URL instead of running it.
Full rule and rationale in the root `CLAUDE.md` linked above.

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

### Local development (all services)
Running the chatbot end-to-end locally needs four processes: Azurite (storage emulator), `mcp-tools` (Azure Functions), `backend` (FastAPI agent), and `frontend`. A repo-root `Procfile` runs all four together via [honcho](https://github.com/nickstenning/honcho):
```bash
pipx install honcho   # one-time; global+isolated since there's no repo-root Python project to add it as a dependency to (backend/data are separate Poetry projects; mcp-tools uses a plain venv + requirements.txt, not Poetry, per Azure Functions Core Tools' own Python packaging expectations)
honcho start           # from Portfolio/ — Ctrl-C stops all four
```
`Portfolio/.env` needs `FUNCTION_APP_URL=http://localhost:7071` and `frontend/.env` needs `BACKEND_URL=http://localhost:8000` (both gitignored, local-only). The `Procfile` pins `PORT` explicitly on the `backend`/`frontend` lines — `honcho` otherwise auto-assigns its own `PORT` per process (Foreman convention), which collides with `main.py`'s and `server.js`'s own `PORT` defaults. The `backend` line also waits for `mcp-tools`'s `func start` to actually finish binding `:7071` (not just print its startup banner) before running, via a `curl`/`sleep` poll loop.

Each service can still be run individually with its own command above if you don't need the full stack — see `docs/Portfolio/plans/2026-08-22-agentic-chatbot-design.md` Task 14 for the manual three-terminal version this replaces.

### Deployment
Three independent deploy targets, each with its own script — run only the one matching what you changed:
```bash
./scripts/ship.sh              # frontend/ or backend/ code -> both Container Apps
./scripts/deploy-mcp-tools.sh  # mcp-tools/ code, or content/site-content.json -> the Function App
./infra/deploy.sh              # infra/main.bicep or a .env secret -> re-run Bicep
```
Full workflow (prerequisites, rollback, first-deploy Function-key setup): `Deployment.md`.

## Architecture

### Frontend
Single-page app with React Router. Two routes: `/` (main portfolio) and `/privacy-policy`. `TerminalHero` is the chat-first hero (absorbed the old floating `Chatbot` widget's CopilotKit wiring), followed by condensed `Projects`/`About` sections styled as terminal echoes. Components: `Header`, `TerminalHero`, `Projects`, `About`, `Footer`, `PrivacyPolicy`. On mount, `TerminalHero` fires a fire-and-forget `GET /api/warmup` to start the backend's cold-start chain (container wake + MCP tool loading) as early as possible, before the visitor's first real message. Assistant replies (`TypedMarkdown`) and user messages both render through `react-markdown` with `remark-math`/`rehype-katex` (+ `katex` CSS), so LaTeX math (`$...$`/`$$...$$`) in a reply renders as typeset equations, not literal text.

`server.js` (the production Express server, not Vite) also handles: an application-level 301 redirect from `www.frederikheda.com` to `https://frederikheda.com` (apex is canonical), the `/api/chatbot` proxy to the backend, the `/api/warmup` route (rate-limited; pings the backend's `/health` in the background and returns immediately), and security headers (HSTS, X-Frame-Options, etc). Both `frederikheda.com` and `www.frederikheda.com` are bound as custom domains on `ca-portfolio-web` with free Azure-managed certificates — see `docs/Portfolio/plans/2026-08-09-azure-migration.md` Task 7 for the DNS/binding setup if it ever needs redoing (e.g. cert renewal issues, DNS provider migration).

### Backend
FastAPI app (`main.py`) that exposes a LangGraph agent over CopilotKit's AG-UI protocol at `/agent/portfolio_agent` (via `add_langgraph_fastapi_endpoint` + `LangGraphAGUIAgent`) — not a custom REST endpoint; the frontend's CopilotKit v2 client talks to this directly. Also serves `/health`. Request flow:
1. `ContentSafetyMiddleware` screens the latest user message via OpenAI's moderation API (`omni-moderation-latest`) before the model runs; a flagged message short-circuits straight to a refusal, skipping the model call entirely.
2. `CopilotKitMiddleware` (from the `copilotkit` package) bridges the AG-UI protocol — this is what merges the frontend's `useFrontendTool`-registered tools (`highlightProjects`, `renderProjectCard`) into the set of tools available to the model, alongside the MCP tools below.
3. The LangGraph agent (`create_agent`, in `agent/agent.py`) runs with `gpt-5.6-luna` (`ChatOpenAI`, `reasoning_effort="none"` — the model 400s on tool calls without it); its behavior comes from `agent/system_prompt.md`.
4. Backend-side tools (`list_projects`, `get_project_details`, `retrieve_information`) aren't defined locally — they're loaded at startup from the `mcp-tools` Azure Function App over MCP (`agent/mcp_tools.py`, streamable-http, using `FUNCTION_APP_URL`/`FUNCTION_MCP_KEY`). `retrieve_information` is what performs the Azure AI Search vector query — that logic lives in `mcp-tools/`, not here.
5. `LoggingMiddleware` logs both the user's message and the model's reply to Azure SQL via `services/database_client.py` (fire-and-forget, background thread), after the agent finishes.

### Agent (`backend/agent/`)
- `agent.py` — builds the LangGraph graph: `create_agent(model=ChatOpenAI(...), tools=<MCP tools>, system_prompt=..., middleware=[...], checkpointer=MemorySaver())`
- `system_prompt.md` — the agent's full behavioral prompt: tone/style plus a description of every backend and frontend tool it has access to. Edit this whenever a tool is added, renamed, or its behavior changes — the frontend tool's own `description` field is not what the model actually reads its instructions from.
- `mcp_tools.py` — connects to the `mcp-tools` Function App via `MultiServerMCPClient` (streamable-http) and loads its tools at startup
- `content_safety_middleware.py` — pre-model moderation gate (OpenAI's moderation API, not Azure Content Safety)
- `logging_middleware.py` — post-agent Azure SQL logging via `services/database_client.py`

There is no local `backend/LLM/` directory, `PromptManager`, `OpenAIClient`, or `ToolOrchestrator` — an earlier implementation shaped that way was replaced by the LangGraph agent above (see `docs/Portfolio/plans/2026-08-22-agentic-chatbot-design.md` for the migration).

### Data Pipeline (`data/`)
- `DocumentProcessor` — converts `.txt`, `.docx`, `.pdf` files into chunks; uses `MarkdownHeaderTextSplitter` first, falls back to `RecursiveCharacterTextSplitter` (5000 tokens, 500 overlap) if headers produce oversized chunks
- `IndexCreator` — creates/manages the Azure AI Search index and uploads embeddings
- `populate_index.py` — entry point; reads source documents from a `cw/` directory

## MCP Servers and Skills

Always prefer up-to-date external sources over training knowledge when working on this codebase. Apply the following by default:

- **context7** (`mcp__context7__resolve-library-id` + `mcp__context7__query-docs`): Use for any library or framework used in this project — React, Vite, Tailwind, FastAPI, OpenAI SDK, Azure SDK, LangChain, etc. Fetch current docs before writing or modifying code that touches these libraries.
- **Microsoft Learn** (`microsoft_docs_search`, `microsoft_docs_fetch`, `microsoft_code_sample_search`): Use when working with Azure AI Search, Azure OpenAI, or any other Azure/Microsoft service — API shapes, SDK versions, configuration options, and billing/pricing/scaling questions (e.g. Container Apps consumption-plan idle vs. active billing, `minReplicas` cost tradeoffs, free grants) all belong here, always, not just as a first try. Its billing docs cover the billing model and rate structure even when they don't quote exact per-unit dollar figures (those live only on the separate, non-Learn `azure.microsoft.com/pricing` page) — if a specific number isn't in Microsoft Learn, say so and ask how to proceed rather than reaching for WebFetch/WebSearch.
- **`claude-api` skill**: Use when touching an OpenAI SDK call site — the direct `openai` client in `backend/agent/content_safety_middleware.py` (moderation API) or `ChatOpenAI` in `backend/agent/agent.py` — or adding new LLM features. The skill provides current Anthropic/OpenAI SDK guidance and best practices.
- **`frontend-design` skill**: Use when making UI changes to keep the frontend quality high.

The rule of thumb: if you are about to write code that calls an external library or cloud API, fetch its current docs first.

## Environment Variables

**Backend** (set via the repo-root `.env` (local) or Container Apps env vars (deployed, via `infra/deploy.sh`)):
- `OPENAI_API_KEY` — used directly (moderation API, `ChatOpenAI`); required at startup
- `FUNCTION_APP_URL`, `FUNCTION_MCP_KEY` — the `mcp-tools` Function App this backend loads its MCP tools from (`FUNCTION_APP_URL` required at startup; `FUNCTION_MCP_KEY` optional locally, required once the Function App enforces its function key in Azure)
- `AZURE_SQL_SERVER`, `AZURE_SQL_DATABASE` — no password, Microsoft Entra ID auth (see `docs/Portfolio/specs/2026-08-09-azure-migration-design.md`)

`azure_search_endpoint`/`azure_index_name`/`azure_search_api_key` are **not** backend env vars — that's `mcp-tools/`'s configuration (it's what actually performs the Azure AI Search vector query, behind the `retrieve_information` MCP tool).

**Frontend**: `BACKEND_URL` — read by `server.js` (Node), not the browser bundle. Defaults to `http://ca-portfolio-backend` (the in-environment Container Apps address, set by Bicep); for local `npm start` testing against a local backend, set it to `http://localhost:8000`.
