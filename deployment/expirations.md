# Expirations

| What | Expires | Renew |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` repo secret (used by `.github/workflows/claude-review.yml`) | about 2027-10-24 | Run `claude setup-token`, then `gh secret set CLAUDE_CODE_OAUTH_TOKEN`. If subscription auth is refused, switch the action input to `anthropic_api_key`. |

The custom domains `frederikheda.com` and `www.frederikheda.com` use free Azure-managed certificates on `ca-portfolio-web`. If a certificate renewal fails or the DNS provider changes, see Task 7 of `docs/Portfolio/plans/2026-08-09-azure-migration.md` (workspace root) for the DNS and binding setup.
