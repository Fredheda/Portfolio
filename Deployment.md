# Deployment Guide

Portfolio is deployed to Azure Container Apps (`rg-chatbot` / `cae-portfolio`),
sharing its resource group and container registry with `copilot-kit-exp` but
running in its own Container Apps environment. No CI/CD — deploys are run
manually from your machine.

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli), logged in (`az login`)
- Docker is **not** required — images are built server-side in ACR via `az acr build`

## Day-to-day deploys (code changes)

```bash
./scripts/ship.sh
```

Builds and pushes both images (tagged with the current git SHA), then rolls
both container apps to them. Refuses to run on a dirty working tree, so the
image tag always honestly matches what's deployed.

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
