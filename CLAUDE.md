# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> This repo lives inside a multi-repo workspace with its own root `CLAUDE.md`
> (`../CLAUDE.md`, one level up) covering workspace-wide conventions — where
> specs/plans go, the git rule, shared MCP/skill usage. Keep that
> file's per-project facts about this repo (test-suite status, architecture
> pointers, etc.) in sync whenever they drift from what's true here.

**Git:** you may run git freely up to a commit, and push a feature branch and
open a PR. `fetch` and `pull` are fine too (default to `pull --ff-only`). Ask
first for `rebase`, `reset`, force-push, deleting branches, or anything on
`main`. Reviewing and merging PRs is the user's alone — hand over the PR URL.
Other Claude sessions share this workspace: work in your own git worktree,
never the main checkout (`git worktree add ../.worktrees/<repo>-<slug> -b <branch> origin/main`,
or the `EnterWorktree` tool; remove it after the PR merges). Full rule in the root `CLAUDE.md`.
PR titles and descriptions must not mention Claude Code or link the Claude
session (no "Generated with Claude Code" footer).
After opening a PR, wait for CI to pass (`gh pr checks --watch`), then read the
LLM review comments (`gh pr view <n> --comments` and
`gh api repos/Fredheda/Portfolio/pulls/<n>/comments`) and address every one of
them, always, before handing the PR URL over for review. Fix the finding, or
reply on the PR with the reason it does not apply. Never leave one unanswered,
and re-check after each push, because the review runs again.

**Response style:** use the `caveman` skill for responses in this repo —
invoke it before replying, not just when asked.

## Project overview

Personal portfolio site for Frederik Heda, live at [frederikheda.com](https://frederikheda.com):
- `frontend/` — React + Vite + Tailwind, plus `server.js` (production Express server). Container App `ca-portfolio-web`.
- `backend/` — FastAPI + LangGraph agent. Container App `ca-portfolio-backend`.
- `mcp-tools/` — Azure Function App `func-portfolio-mcp-tools` serving the agent's MCP tools (including the Azure AI Search query).
- `data/` — standalone scripts that build the Azure AI Search index.

Docs: outward-facing overview in `README.md`; local setup, env vars, checks and the e2e suite in `docs/development.md`; deploy, rollback, logs and expiries in `deployment/` (start at `deployment/README.md`).

## Commands

Details and the full check list are in `docs/development.md`.

```bash
honcho start                                   # repo root: Azurite, mcp-tools, backend, frontend
cd frontend && npm run dev | npm test | npm run lint | npm run e2e
cd backend && poetry run uvicorn main:app --reload
cd backend && poetry run pytest -v && poetry run pyright
cd data && poetry run python populate_index.py
```

- `backend/` and `data/` are separate Poetry projects (Python 3.13, `.python-version`); they pin conflicting `tiktoken` versions and must not share an environment. `data/`'s heavy ML dependencies are deliberately kept out of `backend/pyproject.toml` so they never reach the production image.
- `mcp-tools/` tests run in their own venv (see `docs/development.md`).
- CI (`.github/workflows/ci.yml`) runs on pull requests only, never on a push to `main`. A docs-only PR (root Markdown files, `docs/`, `deployment/`; not `backend/agent/system_prompt.md`, which is runtime input) skips the heavy jobs; otherwise it runs `backend`, `mcp-tools-test`, `deploy-scripts-test`, `frontend` and `e2e`. The `e2e` check is required on `main`. Images are built by the **Deploy apps** workflow, not by CI.
- A new test must catch a bug that no other test (vitest, pytest or e2e) catches. `e2e_backend/` sits outside `backend/` because the backend image copies all of `backend/`. In Playwright specs, CSS locators live in `e2e/selectors.js`; ESLint rejects `.locator(` in spec files.

## Deployment

Three independent targets; run only the one matching what changed: `./scripts/ship.sh` (frontend/backend), `./scripts/deploy-mcp-tools.sh` (`mcp-tools/` or `content/site-content.json`), `./infra/deploy.sh` (Bicep or a `.env` secret). Each has a manual GitHub workflow (**Deploy apps**, **Deploy functions**; `main` only, rollback = an older SHA) and the script is the laptop fallback. A merge runs nothing; **Deploy apps** builds a commit's images the first time it is deployed. `infra/deploy.sh` defaults its image tag to local `HEAD`: pass the deployed SHA. See `deployment/`.

## Architecture contracts

### Frontend
- Two routes: `/` and `/privacy-policy`. `TerminalHero` is the chat-first hero and owns the CopilotKit wiring. `AgentTools` renders nothing; it registers the two frontend tools (`highlightProjects`, `renderProjectCard`).
- On mount, `TerminalHero` fires a fire-and-forget `GET /api/warmup` to start the backend's cold-start chain (container wake + MCP tool loading) before the first real message.
- `server.js` (production, not Vite) also: 301-redirects `www.frederikheda.com` to the apex; hosts the CopilotKit runtime at `/api/copilotkit` (forwards runs to `AGENT_URL`, default `${BACKEND_URL}/agent/portfolio_agent`, and rate-limits `POST /api/copilotkit/agent/:agentId/run`); serves the rate-limited `/api/warmup`; sets security headers. `ca-portfolio-backend` has internal ingress only (no public endpoint), so the browser can only reach it through this server's proxy. Both domains are bound on `ca-portfolio-web` with free managed certificates (redo steps: Task 7 of `docs/Portfolio/plans/2026-08-09-azure-migration.md`).
- Replies and user messages render through `react-markdown` with `remark-math`/`rehype-katex`, so LaTeX renders as equations.

### Backend (request flow)
`main.py` exposes a LangGraph agent over CopilotKit's AG-UI protocol at `/agent/portfolio_agent` (`add_langgraph_fastapi_endpoint` + `LangGraphAGUIAgent`), not a custom REST endpoint. Also serves `/health`.
1. `ContentSafetyMiddleware` screens the latest user message with OpenAI's moderation API (`omni-moderation-latest`, not Azure Content Safety) before the model runs; a flagged message gets a refusal and skips the model.
2. `CopilotKitMiddleware` bridges AG-UI and merges the frontend's registered tools into the model's tool set.
3. The agent (`create_agent` in `agent/agent.py`) uses `gpt-5.6-luna` via `ChatOpenAI` with `reasoning_effort="none"` — the model 400s on tool calls without it. Checkpointer is `MemorySaver`.
4. `list_projects`, `get_project_details` and `retrieve_information` are loaded at startup from the Function App over MCP (`agent/mcp_tools.py`, streamable-http, `FUNCTION_APP_URL`/`FUNCTION_MCP_KEY`). The vector query lives in `mcp-tools/`, not here. If the Function App is unreachable or rejects the key, the backend logs a warning and starts without those three tools; they come back on the next restart.
5. `LoggingMiddleware` logs the user message and reply to Azure SQL via `services/database_client.py` (fire-and-forget background thread) after the agent finishes.

`agent/system_prompt.md` is the model's real instruction source, including the description of every backend and frontend tool. Edit it whenever a tool is added, renamed or changes behavior; a frontend tool's own `description` field is not what the model reads its instructions from.

There is no `backend/LLM/`, `PromptManager`, `OpenAIClient` or `ToolOrchestrator`; an earlier implementation shaped that way was replaced by the LangGraph agent.

### Data pipeline
`data/DocumentProcessor` chunks `.txt`, `.docx` and `.pdf` (Markdown-header split first, recursive split at 5000 tokens / 500 overlap as fallback); `IndexCreator` builds the index; `populate_index.py` reads source documents from a `cw/` directory.

## Environment variables

Backend (repo-root `.env` locally; Container Apps env vars when deployed, set by `infra/deploy.sh`):
- `OPENAI_API_KEY` — moderation API and `ChatOpenAI`; required at startup.
- `FUNCTION_APP_URL`, `FUNCTION_MCP_KEY` — the `mcp-tools` Function App. `FUNCTION_APP_URL` required at startup (locally `http://localhost:7071`); `FUNCTION_MCP_KEY` optional locally, required once Azure enforces the function key.
- `AZURE_SQL_SERVER`, `AZURE_SQL_DATABASE` — no password; Microsoft Entra ID auth.

`azure_search_endpoint` / `azure_index_name` / `azure_search_api_key` are `mcp-tools/` and `data/` configuration, not backend env vars.

Frontend: `BACKEND_URL`, read by `server.js` at runtime (not the browser bundle). Defaults to `http://ca-portfolio-backend` (set by Bicep); use `http://localhost:8000` locally (`frontend/.env`).

Test seams (production sets none): `build_graph(model, moderation_client, db)` and `create_app(build)` in the backend; `RUN_RATE_LIMIT` and `WARMUP_RATE_LIMIT` in `server.js` (defaults 5 and 10 per minute).

## PR review

`.github/workflows/claude-review.yml` posts an AI security-first review on every PR push. It also runs a documentation check: it flags docs that contradict the change or were not updated, or says "Docs: current". The owner can request one with a `@claude` comment. Token expiry and renewal: `deployment/expirations.md`.

## MCP servers and skills

Prefer up-to-date external sources over training knowledge:
- **context7** for any library or framework here (React, Vite, Tailwind, FastAPI, OpenAI SDK, LangChain, CopilotKit, Azure SDK). Fetch current docs before writing code that touches them.
- **Microsoft Learn** for Azure AI Search, Azure OpenAI and any Azure/Microsoft service, including billing and scaling questions (Container Apps idle vs. active billing, `minReplicas`). If a specific price isn't in Microsoft Learn, say so and ask how to proceed rather than using WebFetch/WebSearch.
- **`claude-api` skill** when touching an OpenAI SDK call site (`backend/agent/content_safety_middleware.py`, `ChatOpenAI` in `backend/agent/agent.py`) or adding LLM features.
- **`frontend-design` skill** for UI changes.
