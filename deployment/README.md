# Deployment

Portfolio is deployed to Azure Container Apps (`rg-chatbot` / `cae-portfolio`), sharing its resource group and container registry with `copilot-kit-exp` but running in its own Container Apps environment. There are two deployables: the two container apps (`ca-portfolio-web`, `ca-portfolio-backend`) and the `func-portfolio-mcp-tools` Function App.

Nothing runs on a merge to `main`. You press a button on GitHub (or run a script on your machine) to deploy, and the button builds the images for that commit first if they do not exist yet.

## What to run, by what changed

| Changed | Run |
|---|---|
| `frontend/` or `backend/` code | the **Deploy apps** button on GitHub (or `./scripts/ship.sh`) |
| `mcp-tools/` code, or `content/site-content.json` | the **Deploy functions** button on GitHub (or `./scripts/deploy-mcp-tools.sh`) |
| `infra/main.bicep`, or a secret in `.env` | `./infra/deploy.sh` |

These are three independent deploy targets with their own tooling and their own change cadence. A Container Apps image roll, a Function App code publish and a Bicep re-run are different enough operations (and mcp-tools changes rarely enough) that combining them into one script would mean redeploying the Function App on every routine frontend or backend ship for no reason. Run only the one(s) that match what you actually changed.

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli), logged in (`az login`)
- Docker is **not** required. Images are built server-side in ACR via `az acr build`.

## Files

- [github.md](github.md): the manual **Deploy apps** and **Deploy functions** workflows, one-time GitHub setup, and rollback by SHA.
- [local.md](local.md): the laptop fallbacks, `scripts/ship.sh` and `scripts/deploy-mcp-tools.sh`.
- [infra.md](infra.md): Bicep and `infra/deploy.sh`.
- [operations.md](operations.md): logs and rollback.
- [expirations.md](expirations.md): credentials that expire and how to renew them.

For local development and running the checks, see [../docs/development.md](../docs/development.md).

Full architecture and design rationale: `docs/Portfolio/specs/2026-08-09-azure-migration-design.md` and `docs/Portfolio/plans/2026-08-09-azure-migration.md` (workspace root).
