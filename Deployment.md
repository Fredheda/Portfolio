# Deployment Guide

Portfolio is deployed to Azure Container Apps (`rg-chatbot` / `cae-portfolio`),
sharing its resource group and container registry with `copilot-kit-exp` but
running in its own Container Apps environment. Nothing deploys by itself:
GitHub builds the images on every merge to `main`, and you press a button on
GitHub (or run a script on your machine) to deploy.

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli), logged in (`az login`)
- Docker is **not** required — images are built server-side in ACR via `az acr build`

## What to run, by what changed

| Changed | Run |
|---|---|
| `frontend/` or `backend/` code | the **Deploy apps** button on GitHub (or `./scripts/ship.sh`) |
| `mcp-tools/` code, or `content/site-content.json` | the **Deploy functions** button on GitHub (or `./scripts/deploy-mcp-tools.sh`) |
| `infra/main.bicep`, or a secret in `.env` | `./infra/deploy.sh` |

These are three independent deploy targets with their own tooling and their
own change cadence — a Container Apps image roll, a Function App code
publish, and a Bicep re-run are different enough operations (and mcp-tools
changes rarely enough) that combining them into one script would mean
redeploying the Function App on every routine frontend/backend ship for no
reason. Run only the one(s) that match what you actually changed.

## Day-to-day deploys (frontend/backend code changes)

```bash
./scripts/ship.sh
```

Builds and pushes both images (tagged with the current git SHA), then rolls
both container apps to them. Refuses to run on a dirty working tree, so the
image tag always honestly matches what's deployed. Does **not** touch
`mcp-tools/` — that's a separate Azure Function App, not a Container App;
see below.

## Deploy the apps from GitHub (frontend and backend)

Every merge to `main` runs the `build` job in `ci.yml`, after all other CI
jobs pass. It builds `portfolio-backend` and `portfolio-web` in ACR and stores
them under the full commit SHA (and `:latest`); an image that already exists
for that commit is skipped. Nothing is deployed by a merge.

To deploy, press the **Deploy apps** button: Actions → **Deploy apps** → Run
workflow on `main`, or

```bash
gh workflow run deploy-apps.yml --ref main                  # head of main
gh workflow run deploy-apps.yml --ref main -f sha=<full sha>  # rollback
```

The optional `sha` input takes a full 40-character commit SHA; empty means the
head of `main`. Before it logs in to Azure it checks that the SHA is a full
lowercase SHA and on `main`. Before it changes anything it checks that **both**
images exist for that SHA. Then it rolls `ca-portfolio-backend` and
`ca-portfolio-web`, locks the two new tags against the registry purge, unlocks
the tags the apps ran before, waits until both new revisions are `Provisioned`,
and writes the deployed images to the run summary. Rollback is the same button
with an older SHA whose images still exist.

One-time setup (needs rights to create identities and assign roles, and admin
on the GitHub repo). Run it **before** the pull request that adds the `build`
job is merged, or the first build on `main` fails at the Azure login:
```bash
./scripts/setup-github-apps-deploy.sh
```
It creates two managed identities: `id-portfolio-gh-build` (pushes images,
trusted only for workflows on `main`) and `id-portfolio-gh-deploy` (rolls the
two apps, trusted only for the `production` environment), makes sure
`production` only admits `main`, and stores the Azure IDs the workflows read
as repo secrets (identifiers, not credentials, but the logs of this public repo
are public and a secret's value is masked there). No credential is stored in
GitHub. Re-running it changes nothing.

Old images are removed by a weekly registry task that only touches
`portfolio-backend` and `portfolio-web`: full-SHA tags older than 30 days,
always keeping the newest 10 older ones, never a locked tag or `:latest`. Set
it up once:
```bash
./scripts/setup-acr-purge.sh            # locks what is running, dry run only
./scripts/setup-acr-purge.sh --create   # after reading the dry run: weekly task
```

Limits:
- The registry is in legacy permission mode, which cannot scope pushes by
  repository: the deploy identity's `AcrPush` also lets it push, and the build
  identity can push registry-wide.
- The apps are updated one at a time. If the second update fails, the apps run
  different versions until you press the button again with the right SHA.
- `infra/deploy.sh` defaults its image tag to your local `HEAD`. After a deploy
  from GitHub, run it as `./infra/deploy.sh <deployed-sha>` so a Bicep run
  does not roll the apps to another commit's images.
- Every merge to `main` runs two ACR builds. ACR Tasks build time is billed;
  check it in Cost Management against the monthly budget.
- `scripts/ship.sh` still works as the laptop fallback.

## MCP tools (Azure Function App)

```bash
./scripts/deploy-mcp-tools.sh
```

Publishes `mcp-tools/`'s code to the `func-portfolio-mcp-tools` Function App
via `func azure functionapp publish` (copies the canonical
`content/site-content.json` into `mcp-tools/content/` first, so the deployed
function serves the same content the frontend does). Requires [Azure
Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local)
(`func`) installed locally — a separate CLI from `az`, not something `az`
installs for you.

Run this whenever `mcp-tools/` itself changes, or when `content/site-content.json`
changes and the agent's tool responses need to reflect it (the frontend
picks up that same file automatically on its next `ship.sh`, but the
Function App only picks it up when explicitly republished).

First deploy, or after `infra/deploy.sh` recreates the Function App from
scratch: `infra/deploy.sh`'s own output prints the follow-up steps to wire a
fresh `FUNCTION_MCP_KEY` into the backend container app — run
`deploy-mcp-tools.sh` first, then follow those printed steps.

## MCP tools from GitHub (Azure Function App)

The **Deploy functions** workflow publishes the same Function App
(`func-portfolio-mcp-tools`) from a commit on `main`, without the laptop or
`func`. It runs only when you start it (Actions tab, or
`gh workflow run deploy-functions.yml --ref main`), never on a merge. The
optional `sha` input takes a full 40-character commit SHA; empty means the
head of `main`.

```bash
gh workflow run deploy-functions.yml --ref main                  # head of main
gh workflow run deploy-functions.yml --ref main -f sha=<full sha>  # rollback
```

Before it logs in to Azure it checks that the SHA is a full lowercase SHA, is
on `main`, and has `mcp-tools/` and `content/site-content.json`. It then
copies `content/site-content.json` into `mcp-tools/content/` like
`deploy-mcp-tools.sh` does, zips `mcp-tools/`, and pushes the zip with
`az functionapp deployment source config-zip --build-remote true`. The run
ends by waiting until the Function App lists its functions and prints them in
the run summary.

One-time setup (needs rights to create identities and assign roles, and admin
on the GitHub repo):
```bash
./scripts/setup-github-deploy.sh
```
It creates the managed identity `id-portfolio-mcp-gh-deploy` with Website
Contributor on `func-portfolio-mcp-tools` only, a federated credential that
trusts only the `production` environment of this repo, restricts that
environment to `main`, and stores the Azure IDs the workflow reads as repo
secrets (masked in the public run logs). No credential is stored in GitHub.
Re-running it changes nothing.

Limits:
- Rollback rebuilds the dependencies from the old commit's
  `mcp-tools/requirements.txt` (pinned exactly, so an old SHA gets the same
  versions again).
- Flex Consumption has no deployment slots; a bad deploy is fixed by
  deploying the previous SHA.
- The workflow covers the Function App's code only. The two container apps
  (`scripts/ship.sh`), infra (`infra/deploy.sh`) and the Function key stay
  manual.
- `scripts/deploy-mcp-tools.sh` still works as the laptop fallback.

## Infra changes (Bicep, secrets)

```bash
./infra/deploy.sh
```

Re-runs `infra/main.bicep` against `rg-chatbot`, sourcing all secrets from
the repo-root `.env` (OpenAI key, Azure Search key — never stored anywhere
else). Azure SQL access is passwordless (Microsoft Entra ID via the managed
identity Bicep creates), so there's no SQL secret to source. Idempotent —
safe to re-run any time infra or secrets change.

## Logs

```bash
az containerapp logs show --name ca-portfolio-web --resource-group rg-chatbot --follow
az containerapp logs show --name ca-portfolio-backend --resource-group rg-chatbot --follow
```

## Rollback

On GitHub: press **Deploy apps** with an older full SHA (see above). From your
machine:

```bash
./scripts/redeploy.sh <previous-git-sha>
```

Both need the images for that SHA to still exist in the registry.

Full architecture and design rationale: `docs/Portfolio/specs/2026-08-09-azure-migration-design.md`
and `docs/Portfolio/plans/2026-08-09-azure-migration.md` (workspace root).
