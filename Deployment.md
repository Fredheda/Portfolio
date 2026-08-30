# Deployment Guide

Portfolio is deployed to Azure Container Apps (`rg-chatbot` / `cae-portfolio`),
sharing its resource group and container registry with `copilot-kit-exp` but
running in its own Container Apps environment. No CI/CD — deploys are run
manually from your machine.

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli), logged in (`az login`)
- Docker is **not** required — images are built server-side in ACR via `az acr build`

## What to run, by what changed

| Changed | Run |
|---|---|
| `frontend/` or `backend/` code | `./scripts/ship.sh` |
| `mcp-tools/` code, or `content/site-content.json` | `./scripts/deploy-mcp-tools.sh` |
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

```bash
./scripts/redeploy.sh <previous-git-sha>
```

Full architecture and design rationale: `docs/Portfolio/specs/2026-08-09-azure-migration-design.md`
and `docs/Portfolio/plans/2026-08-09-azure-migration.md` (workspace root).
