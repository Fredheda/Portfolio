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
