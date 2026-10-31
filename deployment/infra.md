# Infrastructure (Bicep, secrets)

```bash
./infra/deploy.sh
```

Re-runs `infra/main.bicep` against `rg-chatbot`, sourcing all secrets from the repo-root `.env` (OpenAI key, Azure Search key), which are never stored anywhere else. Azure SQL access is passwordless (Microsoft Entra ID via the managed identity Bicep creates), so there is no SQL secret to source. The script is idempotent and safe to re-run any time infra or secrets change.

Things to remember:

- `infra/deploy.sh` defaults its image tag to your local `HEAD`. After a deploy from GitHub, pass the deployed SHA: `./infra/deploy.sh <deployed-sha>`. Otherwise a Bicep run could roll the apps to another commit's images.
- If it recreates the Function App from scratch, its output prints the steps to wire a fresh `FUNCTION_MCP_KEY` into the backend container app. See [local.md](local.md).
- The one-time GitHub identities and the registry purge task are set up by scripts described in [github.md](github.md).
