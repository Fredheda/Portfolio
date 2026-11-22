# Operations

## Logs

```bash
az containerapp logs show --name ca-portfolio-web --resource-group rg-chatbot --follow
az containerapp logs show --name ca-portfolio-backend --resource-group rg-chatbot --follow
```

## Rollback

On GitHub: press **Deploy apps** with an older full SHA (see [github.md](github.md)). The **Deploy functions** workflow rolls the Function App back the same way. From your machine:

```bash
./scripts/redeploy.sh <previous-git-sha>
```

Both need the images for that SHA to still exist in the registry. The weekly purge task removes full-SHA tags older than 30 days, keeping the newest 10 older ones and any tag that is locked because an app runs it.

## Custom domains

`frederikheda.com` and `www.frederikheda.com` are bound on `ca-portfolio-web` with free Azure-managed certificates; `customDomains` is declared in `infra/main.bicep`, so an infra deploy keeps the binding. To redo it (a failed certificate renewal, or a new DNS provider):

1. Read the three values: `az containerapp show -n ca-portfolio-web -g rg-chatbot --query properties.customDomainVerificationId -o tsv`, `az containerapp env show -n cae-portfolio -g rg-chatbot --query properties.staticIp -o tsv` and `az containerapp show -n ca-portfolio-web -g rg-chatbot --query properties.configuration.ingress.fqdn -o tsv`.
2. At the DNS provider: an `A` record for `@` with the static IP, a `CNAME` for `www` with the app FQDN, and `TXT` records `asuid` and `asuid.www` with the verification code (one code serves both names). Wait until `dig +short` shows all four.
3. `az containerapp hostname add --name ca-portfolio-web --resource-group rg-chatbot --hostname <name>` for each name, then `az containerapp hostname bind --name ca-portfolio-web --resource-group rg-chatbot --hostname <name> --environment cae-portfolio --validation-method HTTP` for the apex and `--validation-method CNAME` for `www`.
4. Check with `az containerapp hostname list --name ca-portfolio-web --resource-group rg-chatbot -o table` and open both names over https.
