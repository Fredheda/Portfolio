# Infrastructure (Bicep, secrets)

```bash
./infra/deploy.sh
```

Re-runs `infra/main.bicep` against `rg-chatbot`, sourcing all secrets from the repo-root `.env` (OpenAI key, Azure Search key), which are never stored anywhere else. Azure SQL access is passwordless (Microsoft Entra ID via the managed identity Bicep creates), so there is no SQL secret to source. The script is idempotent and safe to re-run any time infra or secrets change.

Things to remember:

- `ca-portfolio-backend` has internal ingress only, so it is not reachable from the public internet. The frontend (`ca-portfolio-web`) proxies to it inside the Container Apps environment.
- `infra/deploy.sh` defaults its image tag to your local `HEAD`. After a deploy from GitHub, pass the deployed SHA: `./infra/deploy.sh <deployed-sha>`. Otherwise a Bicep run could roll the apps to another commit's images.
- If it recreates the Function App from scratch, its output prints the steps to wire a fresh `FUNCTION_MCP_KEY` into the backend container app. See [local.md](local.md).
- The one-time GitHub identities and the registry purge task are set up by scripts described in [github.md](github.md).

## Blog read identity

`id-portfolio-blogread` is attached to `ca-portfolio-backend` and holds no Azure role. Its only grant is the `Blog.Read` app role in the blog project. `AZURE_CLIENT_ID` stays the ACR and SQL identity. Bicep outputs `blogReadIdentityClientId` and `blogReadIdentityPrincipalId`; `deploy.sh` prints both at the end.

Enable the blog in this order, each step with the owner's yes:

1. `./infra/deploy.sh <deployed-sha>` creates and attaches the identity. `BLOG_API_URL` stays unset, so the backend serves no `/blog` routes.
2. In the blog project: `./scripts/approve-client.sh <client-id> --apply` (`clientId` from step 1), then its `./infra/deploy.sh <sha>`.
3. Put `BLOG_API_URL` and `BLOG_API_AUDIENCE` (`api://<application id>`) in `.env`, then `./infra/deploy.sh <deployed-sha>` again.

Check: `curl -s https://frederikheda.com/api/blog/posts` returns 200. The managed-identity endpoint caches authorization data per resource for up to 24 hours. If the token was fetched before step 2, the backend logs `blog api request failed: 403`, the site answers 503 `blog_unavailable`, and the role claim arrives later. Approving before enabling avoids this.
