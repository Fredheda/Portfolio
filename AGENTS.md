# AGENTS.md

Repo facts. The shared rules block at the end holds the rules every repo follows.

`./scripts/ci-local.sh` runs every CI check locally.

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

- `backend/` and `data/` are separate Poetry projects that never share one environment; `mcp-tools/` tests run in their own venv (`docs/development.md`).
- CI (`.github/workflows/ci.yml`): pull requests only, never a push to `main`. A draft PR runs the light jobs (`changes`, `backend`, `mcp-tools-test`, `deploy-scripts-test`, `data`, `frontend` without its build); `e2e`, the frontend build and the AI review wait for ready. `scripts/changed-areas.sh` (job `changes`) skips the heavy jobs for a docs-only PR (root Markdown, `docs/`, `deployment/`; not `backend/agent/system_prompt.md`, which is runtime input) and sets `data=true`, the only trigger of the `data` job (the offline `data/` tests), when a PR touches `data/`, a workflow or a script. Required checks on `main` (ruleset `main-protect`): `backend`, `mcp-tools-test`, `deploy-scripts-test`, `frontend`, `e2e`, `gitleaks`, `bandit`, `workflow-lint`; a skipped job passes; `pip-audit`, `npm-audit` and `codeql` are not required. A job-id change needs a ruleset update in the same change. `gh pr ready` cancels a run in flight; its cancelled required checks keep the PR BLOCKED until `gh run rerun`. **Deploy apps** builds images, not CI. npm is pinned (`npm install -g npm@12.2.2`) in both `frontend/Dockerfile` stages and the jobs `frontend`, `e2e` and `npm-audit`; bump all of them together (`scripts/tests/test_npm_pin.py` fails on a missing or differing pin; Dependabot does not bump it). `ci-local.sh` uses the installed npm.
- `e2e_backend/` sits outside `backend/` because the backend image copies all of `backend/`. In Playwright specs, CSS locators live in `e2e/selectors.js`; ESLint rejects `.locator(` in spec files. Two concurrent e2e runs need their own ports (`docs/development.md`, "Browser tests").

## Deployment

Three independent targets; run the one that matches the change: `./scripts/ship.sh` (frontend/backend), `./scripts/deploy-mcp-tools.sh` (`mcp-tools/`; a `content/site-content.json` change needs this and `ship.sh`), `./infra/deploy.sh` (Bicep or a `.env` secret). Each has a manual GitHub workflow (**Deploy apps**, **Deploy functions**; `main` only; rollback = an older SHA); the script is the laptop fallback. A merge runs nothing; **Deploy apps** builds a commit's images on its first deploy. `infra/deploy.sh` defaults its image tag to local `HEAD`: pass the deployed SHA. See `deployment/`.

Every workflow run waits for the owner's approval in GitHub (`production` requires the owner as reviewer; `gh run watch` polls until then).
## Architecture contracts

### Frontend
- Routes: `/` (hero, experience, fredbot, projects; the Posts section is hidden, `Posts.jsx` stays), `/about` (hidden: redirects to `/`; `About.jsx` stays), `/projects/:slug` (case studies; the "For engineers" choice is kept in `sessionStorage` by `useEngineerMode`), `/privacy-policy`, `/blog` and `/blog/:slug` (posts read through `/api/blog/*`; `components/blog/BlogBody.jsx` renders the body: maths as native MathML, no maths font, system font stacks, our own `highlight.js` token colours in `index.css`; the header shows a Blog link (`useBlogAvailable`: one list request per page load, asked again after 5, 15 and 30 s when it fails; an empty list or a switched-off blog is not retried) once the list holds a post), and a not-found page. Header section links are `/#id`; `useHashScroll` scrolls to them on the home page.
- All page text comes from `content/site-content.json`, read through `src/lib/content.js` (zod schema; never import the JSON directly). Content flow and `[draft]` markers: `docs/development.md`, "Site content".
- `FredbotPanel` (the "Ask fredbot" section) owns the chat UI: prompt lines, tool lines measured from AG-UI tool-call events (`useToolTimings`), suggestion chips. It takes focus only after the visitor uses it, with `preventScroll`. `AgentTools` renders nothing; it registers the two frontend tools (`highlightProjects`, `renderProjectCard`) and stays mounted on every route.
- On mount, `FredbotPanel` fires a fire-and-forget `GET /api/warmup` to start the backend's cold-start chain (container wake + MCP tool loading) before the first real message.
- `server.js` serves `dist/index.html` with each route's `<title>` and Open Graph tags from `dist/route-meta.json`, which the Vite build writes from the content file (`src/lib/routeMeta.js`); the lookup (`routeLookup.js`, own properties only, as defence in depth: an inherited name such as `constructor` is never a route) is a separate file, which the runtime image must copy (`scripts/tests/test_frontend_image.py` fails when a local module `server.js` imports is missing from `frontend/Dockerfile`); a path not in it gets the app shell with a 404, except a slug-shaped `/blog/<slug>`, which gets the `/blog` tags with a 200 (the post may not exist; the page then shows not-found and sets `noindex`).
- `server.js` (production, not Vite) also: 301-redirects `www.frederikheda.com` to the apex; hosts the CopilotKit runtime at `/api/copilotkit` (forwards runs to `AGENT_URL`, default `${BACKEND_URL}/agent/portfolio_agent`, and rate-limits `POST /api/copilotkit/agent/:agentId/run`); serves the rate-limited `/api/warmup`; forwards GET `/api/blog/*` to the backend (120 per minute per IP); sets security headers. `ca-portfolio-backend` has internal ingress only (no public endpoint), so the browser can only reach it through this server's proxy. Both domains are bound on `ca-portfolio-web` with free managed certificates (redo steps: `deployment/operations.md`, "Custom domains").
- Replies and user messages render through `react-markdown` with `remark-math`/`rehype-katex` in MathML mode (`mathRehypePlugins` in `lib/markdown.js`): LaTeX renders as native equations, and no KaTeX stylesheet or font file is in the build. `vite.config.mjs` stubs the `katex.min.css` that CopilotKit and `streamdown` import from `node_modules`; a server test (`dist/assets` holds no `KaTeX_*` file or KaTeX stylesheet) guards it.

### Backend (request flow)
`main.py` exposes a LangGraph agent over CopilotKit's AG-UI protocol at `/agent/portfolio_agent` (`add_langgraph_fastapi_endpoint` + `SafeErrorAgent`, a `LangGraphAGUIAgent` subclass in `agent/safe_errors.py`), not a custom REST endpoint. Also serves `/health`. A failed run ends with one `RUN_ERROR` carrying the fixed `GENERIC_RUN_ERROR` text and no `rawEvent`; the log line holds the exception type and HTTP status only (`describe`), never the message: provider error text can carry keys, hosts or the visitor's own message, and ag-ui-langgraph above 0.0.42 sends `str(exc)` to the browser; `SafeErrorAgent` makes that bump safe.
1. `ContentSafetyMiddleware` screens the latest user message with OpenAI's moderation API (`omni-moderation-latest`, not Azure Content Safety) before the model runs; a flagged message gets a refusal and skips the model.
2. `CopilotKitMiddleware` bridges AG-UI and merges the frontend's registered tools into the model's tool set.
3. The agent (`create_agent` in `agent/agent.py`) uses `gpt-5.6-luna` via `ChatOpenAI` with `reasoning_effort="none"` — the model 400s on tool calls without it. Checkpointer is `MemorySaver`.
4. `get_profile`, `list_projects`, `get_project_details` and `retrieve_information` are loaded at startup from the Function App over MCP (`agent/mcp_tools.py`, streamable-http, `FUNCTION_APP_URL`/`FUNCTION_MCP_KEY`). The first three read the content file; the vector query lives in `mcp-tools/`, not here. If the Function App is unreachable or rejects the key, the backend logs a warning and starts without those four tools; they come back on the next restart. A failed search returns the fixed `SEARCH_UNAVAILABLE` text (`mcp-tools/function_app.py`), never the provider error: a tool result reaches the model and the browser's event stream. The Function App logs the exception type and HTTP status only (`mcp-tools/describe.py`).
5. No visitor message or reply is stored or logged: no middleware writes them. The legacy `chatbot_logs` table remains in the shared database and nothing writes it.
6. `blog/` is the client of the blog read API v1 (separate project; the blog is off unless `BLOG_API_URL` is set). `routes.py` serves GET `/blog/posts`, `/blog/posts/{slug}`, `/blog/posts/{slug}/media/{id}` and `/blog/posts/{slug}/audio`; `server.js` forwards GET `/api/blog/*` to them. `client.py` is the one adapter (models in `models.py` ignore unknown fields and drop storage paths), with a 15 s cache, ETag revalidation, a 15 minute stale-if-error window for outages only (a 404 evicts the post, its media links and the cached lists) and one retry (read timeout 25 s, so both attempts fit inside `server.js`'s 60 s wait for headers; `scripts/tests/test_blog_timeouts.py`). The JSON routes send `Cache-Control: no-cache` and an `ETag` (304 on a match), so browsers revalidate on every view. `token.py` gets the token for `BLOG_API_AUDIENCE` from the user-assigned identity `BLOG_READ_CLIENT_ID` (`id-portfolio-blogread`, no Azure roles). `media.py` streams blobs from the signed URLs the API returns: https, exact host in `BLOG_MEDIA_HOSTS`, no redirects, content-type allowlist. Errors have fixed bodies; nothing from the blog API reaches a log or a browser. A half-configured blog stays off with one error line.

`agent/system_prompt.md` is the model's real instruction source, including the description of every backend and frontend tool. Edit it whenever a tool is added, renamed or changes behavior; a frontend tool's own `description` field is not what the model reads its instructions from.

### Data pipeline
`data/DocumentProcessor` chunks `.txt`, `.docx` and `.pdf` (Markdown-header split first, recursive split at 5000 tokens / 500 overlap as fallback); `IndexCreator` builds the index; `populate_index.py` reads source documents from a `cw/` directory. It runs at import time (no `__main__` guard): importing it, or any test that does, re-embeds every chunk and upserts the live index.

## Environment variables

Names only; what each does and where it goes: `docs/development.md`, "Environment variables".

- Backend (repo-root `.env` locally; Container Apps env vars set by `infra/deploy.sh`): `OPENAI_API_KEY`, `FUNCTION_APP_URL`, `FUNCTION_MCP_KEY`; `BLOG_API_URL`, `BLOG_API_AUDIENCE`, `BLOG_READ_CLIENT_ID`, optional `BLOG_MEDIA_HOSTS` (blog off when `BLOG_API_URL` is unset).
- `azure_search_endpoint`, `azure_index_name`, `azure_search_api_key`: `mcp-tools/` and `data/`, not backend variables.
- Frontend: `BACKEND_URL`, read by `server.js` at runtime (`frontend/.env` locally).
- Local servers: `HOST` (default `127.0.0.1`) and `PORT` for `server.js` and `python main.py`; the images listen on all interfaces (`docs/development.md`, "Environment variables").
- Test seams (production sets none): `build_graph(model, moderation_client)` and `create_app(build, blog)` in the backend; `RUN_RATE_LIMIT`, `WARMUP_RATE_LIMIT` and `BLOG_RATE_LIMIT` in `server.js` (defaults 5, 10 and 120 per minute).

## Security checks

`.github/workflows/security.yml` runs on PRs and weekly (Mon 05:23 UTC), never on a push to `main`. `gitleaks` and `workflow-lint` run on every PR push; the rest run when the PR is ready. Job ids are stable (required-checks ruleset).

| Job | Blocks PR? | Run locally |
|---|---|---|
| `gitleaks` | yes | `docker run --rm -v "$PWD:/repo" ghcr.io/gitleaks/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f git /repo --redact --no-banner` |
| `workflow-lint` | yes | `docker run --rm -v "$PWD:/repo" --workdir /repo rhysd/actionlint:1.7.12@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667` |
| `bandit` (HIGH only) | yes | `uvx bandit@1.9.4 -r backend data mcp-tools scripts e2e_backend -lll -x backend/tests,mcp-tools/tests,scripts/tests,.venv` |
| `pip-audit` | advisory on PRs, fails weekly | `poetry -C backend export --without-hashes -o /tmp/b.txt && uvx pip-audit@2.10.1 -r /tmp/b.txt --no-deps --disable-pip` (same for `data`); `uvx pip-audit@2.10.1 -r mcp-tools/requirements.txt` |
| `npm-audit` | advisory on PRs, fails weekly | `cd frontend && npm audit --omit=dev --audit-level=high` |
| `codeql` | no, findings in the Security tab | CI only |

`pip-audit` audits the locked sets of `backend/` and `data/` (no install). Fix a finding, or add a dated ignore with the reason next to the command.

`frontend/package.json` `overrides.zod` forces zod 4 over CopilotKit's zod 3: no zod 3 release fixes GHSA-mrhx-c7xc-m3w5. The e2e chat flow is the gate; keep the override's range equal to the direct `zod` dependency (npm rejects a mismatch). `@copilotkit/*` 1.85 and later pull `@a2ui/web_core` 0.15, which needs zod 3 and crashes the provider at load under the override, so `dependabot.yml` ignores `>=1.85.0`; lift it when `@a2ui/web_core` supports zod 4. `vite` is a dev dependency (build only, not in the runtime image).

## Dependabot

`.github/dependabot.yml`: monthly version updates, one grouped PR per ecosystem (pip for `backend/`, `data/`, `mcp-tools/`; npm for `frontend/`; GitHub Actions; Docker for both Dockerfiles), label `dependencies`, 14-day cooldown. Major bumps are ignored for pip, npm and Docker and done by hand; the Python image also ignores minor bumps (the backend requires Python 3.13). Security-update PRs are separate: not grouped, no cooldown. Dependabot PRs get no secrets, so the AI review skips them; CI and `security.yml` run as usual.

Dependencies: 14-day install cooldown (`frontend/.npmrc`, `backend/poetry.toml`, `data/poetry.toml`), exact Poetry and pip pins, actions pinned by commit, every Docker image also carrying its digest, and a fully pinned `mcp-tools/requirements.txt` (no hashes; `scripts/compile-mcp-tools-requirements.sh`). `scripts/tests/test_supply_chain.py` guards all of it (`docs/development.md`, "Dependencies").

## PR review

`.github/workflows/claude-review.yml` posts a comment-only AI review on every push to a ready (non-draft) PR: security first (including sensitive detail in docs, specs and plans), a documentation check ("Docs: current" or findings) and advisory size and tests checks, ending with an advisory `Verdict:` line (`ready to merge` or `changes requested (N open)`). The owner can request one with a `@claude` comment (also on a draft). Each run draws on the Claude subscription usage limit. Token expiry and renewal: `deployment/expirations.md`.

## Skills

- `claude-api` when touching an OpenAI SDK call site (`backend/agent/content_safety_middleware.py`, `ChatOpenAI` in `backend/agent/agent.py`) or adding LLM features.
- `frontend-design` for UI changes.
- Context7 and Microsoft Learn for library and Azure docs; this repo's lookups are React, Vite, Tailwind, FastAPI, LangChain, CopilotKit, the OpenAI and Azure SDKs, Azure AI Search and Azure OpenAI.

<!-- shared:start -->
## Shared rules (identical in every repo; never edit here)

Copied from the owner's template. The `shared-block` rule fails CI when this block differs from it.

**Ownership.** You own this codebase: keep it maintainable, secure, free of bugs, duplicated code and needless comments. Fix tech debt you meet in the files you touch.

**Tickets.** Work only the ticket assigned to you; one ticket is one PR. Keep its Jira status true: `In Progress` on start and while the PR is open, `Done` only after merge and cleanup. Record decisions, steps and open questions on the ticket, not in chat. A question for the owner goes on the ticket as one exact question; keep working on what does not depend on it. Start every ticket or PR comment with your agent name in brackets, such as `[Claude Coding Agent]` or `[Devin Coding Agent]`.

**Git.** Work on a feature branch; never push to `main`, force-push, rebase or reset a shared branch, or delete a branch you did not create. Commit messages: 2 lines at most, no trailer. The owner alone reviews, approves and merges; hand over the PR URL and wait.

**Pull requests.** At most 25 changed files and 5000 changed lines (lockfiles, fixtures, generated files and `docs/` excluded); the `pr-size` rule fails a larger PR unless the owner set the label `size-override`. Open a draft first. Before asking for review run `scripts/ci-local.sh` until it passes, then wait for CI, the security checks and the automated review, and fix or answer every comment. A PR that changes what a user sees carries a screenshot or a short video when you cannot offer a local run.

**Tests first.** Write and run each behaviour's failing test before the code. Every test must catch a bug no other test catches; remove a test that does not. Never commit a test that only proves something was removed: show that evidence once in the PR description. A test of behaviour the code still has stays, also when it asserts that something is refused or not forwarded.

**Comments.** The default is no comment. Keep or add one only for a reason the code cannot show (a constraint, a security reason, a workaround with its source). When you edit a file, delete every comment in it that restates the code, narrates a change or points at a ticket, and every redundant test, in the same PR, in a separate commit; delete aggressively, git history keeps the rest. The `comment-count` rule fails a PR in which a file's comment count grows, unless the PR description has a line `Comments: <path>: <reason>` for that file.

**Specs and plans.** A non-trivial ticket has a spec in `docs/specs/` and a plan in `docs/plans/` (`YYYY-MM-DD-slug.md`, the plan uses the spec's slug). They merge as a docs-only PR before the code PR; the ticket description names both paths. Never move a merged spec or plan; the code PR sets `Status: done (PR #n)` in its header.

**Nothing sensitive in the repo.** No secret, key or `.env` file. No Azure resource id, subscription, tenant or client id, no host that is not public, and no open weakness in code, docs, specs or plans: those go on the ticket only.

**Dependencies.** Add or update only with the repo's package manager, inside the repo. Never pass a flag or variable that relaxes the 14-day release cooldown.

**Deploys and cloud changes.** Only on the owner's explicit yes for that one run, recorded on the ticket. Never approve a waiting deployment.

**Rules a machine checks.** `scripts/rules/run.sh` runs them, locally and in the CI job `rules`. Fix what a rule reports; never bypass or weaken a rule to pass. A correction from the owner becomes a new rule there, not a sentence here.

**Docs.** Every PR updates the docs it makes untrue. Edit `AGENTS.md`; `CLAUDE.md` only imports it.
<!-- shared:end -->
