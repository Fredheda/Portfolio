# CLAUDE.md

Repo facts only. The workspace `CLAUDE.md` (`../CLAUDE.md`) owns the rest: style, git and worktrees, ways of working, tooling, Jira, specs and plans.

PR titles and descriptions never mention Claude Code. `./scripts/ci-local.sh` runs every CI check locally; green before `gh pr ready`.

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

- `backend/` and `data/` are separate Poetry projects (Python 3.13, `.python-version`) that never share one environment; `mcp-tools/` tests run in their own venv (`docs/development.md`).
- CI (`.github/workflows/ci.yml`): pull requests only, never a push to `main`. A draft PR runs the light jobs (`changes`, `backend`, `mcp-tools-test`, `deploy-scripts-test`, `data`, `frontend` without its build); `e2e`, the frontend build and the AI review wait for ready. `scripts/changed-areas.sh` (job `changes`) skips the heavy jobs for a docs-only PR (root Markdown, `docs/`, `deployment/`; not `backend/agent/system_prompt.md`, which is runtime input) and sets `data=true`, the only trigger of the `data` job (the offline `data/` tests), when a PR touches `data/`, a workflow or a script. Required checks on `main` (ruleset `main-protect`): `backend`, `mcp-tools-test`, `deploy-scripts-test`, `frontend`, `e2e`, `gitleaks`, `bandit`, `workflow-lint`; a skipped job passes; `pip-audit`, `npm-audit` and `codeql` are not required. A job-id change needs a ruleset update in the same change. Let the draft run finish before `gh pr ready`: `ready` cancels a run in flight, and its cancelled required checks keep the PR BLOCKED until `gh run rerun`. **Deploy apps** builds images, not CI.
- A new test must catch a bug that no other test (vitest, pytest or e2e) catches. `e2e_backend/` sits outside `backend/` because the backend image copies all of `backend/`. In Playwright specs, CSS locators live in `e2e/selectors.js`; ESLint rejects `.locator(` in spec files. The e2e servers use ports 3210, 8210 and 8211; two concurrent runs need their own via `E2E_WEB_PORT`, `E2E_BACKEND_PORT`, `E2E_MCP_PORT` (`docs/development.md`, "Browser tests").

## Deployment

Three independent targets; run the one that matches the change: `./scripts/ship.sh` (frontend/backend), `./scripts/deploy-mcp-tools.sh` (`mcp-tools/`; a `content/site-content.json` change needs this and `ship.sh`), `./infra/deploy.sh` (Bicep or a `.env` secret). Each has a manual GitHub workflow (**Deploy apps**, **Deploy functions**; `main` only; rollback = an older SHA); the script is the laptop fallback. A merge runs nothing; **Deploy apps** builds a commit's images on its first deploy. `infra/deploy.sh` defaults its image tag to local `HEAD`: pass the deployed SHA. See `deployment/`.

Every workflow run waits for the owner's approval in GitHub (`production` requires the owner as reviewer; `gh run watch` polls until then). Rule: workspace `CLAUDE.md`, "Production deploys".

## Architecture contracts

### Frontend
- Routes: `/` (hero, experience, fredbot, projects; the Posts section is hidden, `Posts.jsx` stays), `/about`, `/projects/:slug` (case studies; the "For engineers" choice is kept in `sessionStorage` by `useEngineerMode`), `/privacy-policy`, and a not-found page. Header section links are `/#id`; `useHashScroll` scrolls to them on the home page.
- All page text comes from `content/site-content.json`, read through `src/lib/content.js` (zod schema; never import the JSON directly). Content flow and `[draft]` markers: `docs/development.md`, "Site content".
- `FredbotPanel` (the "Ask fredbot" section) owns the chat UI: prompt lines, tool lines measured from AG-UI tool-call events (`useToolTimings`), suggestion chips. It takes focus only after the visitor uses it, with `preventScroll`. `AgentTools` renders nothing; it registers the two frontend tools (`highlightProjects`, `renderProjectCard`) and stays mounted on every route.
- On mount, `FredbotPanel` fires a fire-and-forget `GET /api/warmup` to start the backend's cold-start chain (container wake + MCP tool loading) before the first real message.
- `server.js` serves `dist/index.html` with each route's `<title>` and Open Graph tags from `dist/route-meta.json`, which the Vite build writes from the content file (`src/lib/routeMeta.js`); a path not in it gets the app shell with a 404.
- `server.js` (production, not Vite) also: 301-redirects `www.frederikheda.com` to the apex; hosts the CopilotKit runtime at `/api/copilotkit` (forwards runs to `AGENT_URL`, default `${BACKEND_URL}/agent/portfolio_agent`, and rate-limits `POST /api/copilotkit/agent/:agentId/run`); serves the rate-limited `/api/warmup`; sets security headers. `ca-portfolio-backend` has internal ingress only (no public endpoint), so the browser can only reach it through this server's proxy. Both domains are bound on `ca-portfolio-web` with free managed certificates (redo steps: Task 7 of `docs/Portfolio/plans/2026-08-09-azure-migration.md`).
- Replies and user messages render through `react-markdown` with `remark-math`/`rehype-katex`, so LaTeX renders as equations.

### Backend (request flow)
`main.py` exposes a LangGraph agent over CopilotKit's AG-UI protocol at `/agent/portfolio_agent` (`add_langgraph_fastapi_endpoint` + `SafeErrorAgent`, a `LangGraphAGUIAgent` subclass in `agent/safe_errors.py`), not a custom REST endpoint. Also serves `/health`. A failed run ends with one `RUN_ERROR` carrying the fixed `GENERIC_RUN_ERROR` text and no `rawEvent`; the real error is logged redacted (`redact`: key, org, request id, URL and header values replaced). Provider error text can carry such values, and ag-ui-langgraph above 0.0.42 sends `str(exc)` to the browser; `SafeErrorAgent` makes that bump safe.
1. `ContentSafetyMiddleware` screens the latest user message with OpenAI's moderation API (`omni-moderation-latest`, not Azure Content Safety) before the model runs; a flagged message gets a refusal and skips the model.
2. `CopilotKitMiddleware` bridges AG-UI and merges the frontend's registered tools into the model's tool set.
3. The agent (`create_agent` in `agent/agent.py`) uses `gpt-5.6-luna` via `ChatOpenAI` with `reasoning_effort="none"` — the model 400s on tool calls without it. Checkpointer is `MemorySaver`.
4. `get_profile`, `list_projects`, `get_project_details` and `retrieve_information` are loaded at startup from the Function App over MCP (`agent/mcp_tools.py`, streamable-http, `FUNCTION_APP_URL`/`FUNCTION_MCP_KEY`). The first three read the content file; the vector query lives in `mcp-tools/`, not here. If the Function App is unreachable or rejects the key, the backend logs a warning and starts without those four tools; they come back on the next restart. A failed search returns the fixed `SEARCH_UNAVAILABLE` text (`mcp-tools/function_app.py`), never the provider error: a tool result reaches the model and the browser's event stream. The Function App logs the error type with the message passed through `mcp-tools/redact.py`.
5. `LoggingMiddleware` logs the user message and reply to Azure SQL via `services/database_client.py` (fire-and-forget background thread, one retry after 10 s on error 40613 when the free-tier database is paused) after the agent finishes. It never logs tool messages and does not run when the graph raises, so no tool or provider error text reaches the database.

`agent/system_prompt.md` is the model's real instruction source, including the description of every backend and frontend tool. Edit it whenever a tool is added, renamed or changes behavior; a frontend tool's own `description` field is not what the model reads its instructions from.

### Data pipeline
`data/DocumentProcessor` chunks `.txt`, `.docx` and `.pdf` (Markdown-header split first, recursive split at 5000 tokens / 500 overlap as fallback); `IndexCreator` builds the index; `populate_index.py` reads source documents from a `cw/` directory. It runs at import time (no `__main__` guard): importing it, or any test that does, re-embeds every chunk and upserts the live index.

## Environment variables

Names only; what each does and where it goes: `docs/development.md`, "Environment variables".

- Backend (repo-root `.env` locally; Container Apps env vars set by `infra/deploy.sh`): `OPENAI_API_KEY`, `FUNCTION_APP_URL`, `FUNCTION_MCP_KEY`, `AZURE_SQL_SERVER`, `AZURE_SQL_DATABASE`, and when deployed `AZURE_CLIENT_ID` (the app's managed identity for Azure SQL).
- `azure_search_endpoint`, `azure_index_name`, `azure_search_api_key`: `mcp-tools/` and `data/`, not backend variables.
- Frontend: `BACKEND_URL`, read by `server.js` at runtime (`frontend/.env` locally).
- Test seams (production sets none): `build_graph(model, moderation_client, db)` and `create_app(build)` in the backend; `RUN_RATE_LIMIT` and `WARMUP_RATE_LIMIT` in `server.js` (defaults 5 and 10 per minute).

## Security checks

`.github/workflows/security.yml` runs on PRs and weekly (Mon 05:23 UTC), never on a push to `main`. `gitleaks` and `workflow-lint` run on every PR push; the rest run when the PR is ready. Job ids are stable (required-checks ruleset).

| Job | Blocks PR? | Run locally |
|---|---|---|
| `gitleaks` | yes | `docker run --rm -v "$PWD:/repo" ghcr.io/gitleaks/gitleaks:v8.30.1 git /repo --redact --no-banner` |
| `workflow-lint` | yes | `docker run --rm -v "$PWD:/repo" --workdir /repo rhysd/actionlint:1.7.12` |
| `bandit` (HIGH only) | yes | `uvx bandit@1.9.4 -r backend data mcp-tools scripts e2e_backend -lll -x backend/tests,mcp-tools/tests,scripts/tests,.venv` |
| `pip-audit` | advisory on PRs, fails weekly | `poetry -C backend export --without-hashes -o /tmp/b.txt && uvx pip-audit@2.10.1 -r /tmp/b.txt --no-deps --disable-pip` (same for `data`); `uvx pip-audit@2.10.1 -r mcp-tools/requirements.txt` |
| `npm-audit` | advisory on PRs, fails weekly | `cd frontend && npm audit --omit=dev --audit-level=high` |
| `codeql` | no, findings in the Security tab | CI only |

`pip-audit` audits the locked sets of `backend/` and `data/` (no install). Fix a finding, or add a dated ignore with the reason next to the command.

`frontend/package.json` `overrides.zod` forces zod 4 over CopilotKit's zod 3: no zod 3 release fixes GHSA-mrhx-c7xc-m3w5. The e2e chat flow is the gate; keep the override's range equal to the direct `zod` dependency (npm rejects a mismatch). `vite` is a dev dependency (build only, not in the runtime image).

## Dependabot

`.github/dependabot.yml`: monthly version updates, one grouped PR per ecosystem (pip for `backend/`, `data/`, `mcp-tools/`; npm for `frontend/`; GitHub Actions; Docker for both Dockerfiles), label `dependencies`, 14-day cooldown. Major bumps are ignored for pip, npm and Docker and done by hand. Security-update PRs are separate: not grouped, no cooldown. Dependabot PRs get no secrets, so the AI review skips them; CI and `security.yml` run as usual. Who merges them: "Merging" under "PR review".

## PR review

`.github/workflows/claude-review.yml` posts a comment-only AI review on every push to a ready (non-draft) PR: security first, a documentation check ("Docs: current" or findings) and advisory size and tests checks. The owner can request one with a `@claude` comment. Token expiry and renewal: `deployment/expirations.md`.

- **Merging:** the owner merges, except the bot and docs classes in the workspace `CLAUDE.md` (Git), which the coordinator merges.

## Skills

- `claude-api` when touching an OpenAI SDK call site (`backend/agent/content_safety_middleware.py`, `ChatOpenAI` in `backend/agent/agent.py`) or adding LLM features.
- `frontend-design` for UI changes.
- Context7 and Microsoft Learn per the workspace rule; this repo's lookups are React, Vite, Tailwind, FastAPI, LangChain, CopilotKit, the OpenAI and Azure SDKs, Azure AI Search and Azure OpenAI.
