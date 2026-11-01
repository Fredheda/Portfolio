# Deploying from your laptop

The manual **Deploy apps** and **Deploy functions** workflows on GitHub are the normal path (see [github.md](github.md)). These scripts are the fallback. Both need the Azure CLI logged in (`az login`); Docker is not needed.

## Apps (frontend and backend code changes)

```bash
./scripts/ship.sh
```

Builds and pushes both images (tagged with the current git SHA), then rolls both container apps to them. It refuses to run on a dirty working tree, so the image tag always honestly matches what is deployed. It does **not** touch `mcp-tools/`, which is a separate Azure Function App and not a Container App.

## MCP tools (Azure Function App)

```bash
./scripts/deploy-mcp-tools.sh
```

Publishes `mcp-tools/`'s code to the `func-portfolio-mcp-tools` Function App via `func azure functionapp publish`. It copies the canonical `content/site-content.json` into `mcp-tools/content/` first, so the deployed function serves the same content the frontend does. It requires [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local) (`func`) installed locally. That is a separate CLI from `az`, not something `az` installs for you.

Run this whenever `mcp-tools/` itself changes, and together with `ship.sh` whenever `content/site-content.json` changes (see [README.md](README.md)).

First deploy, or after `infra/deploy.sh` recreates the Function App from scratch: `infra/deploy.sh`'s own output prints the follow-up steps to wire a fresh `FUNCTION_MCP_KEY` into the backend container app. Run `deploy-mcp-tools.sh` first, then follow those printed steps.

## Rollback

```bash
./scripts/redeploy.sh <previous-git-sha>
```

The images for that SHA must still exist in the registry. See [operations.md](operations.md).
