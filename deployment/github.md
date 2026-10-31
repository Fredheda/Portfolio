# Deploying from GitHub

Nothing runs on a merge to `main`: CI runs on pull requests only. Deploying is a manual button, and a commit is built the first time it is deployed. For the laptop fallback, see [local.md](local.md).

## Deploy the apps (frontend and backend)

Press the **Deploy apps** button: Actions, then **Deploy apps**, then Run workflow on `main`. Or from the command line:

```bash
gh workflow run deploy-apps.yml --ref main                  # head of main
gh workflow run deploy-apps.yml --ref main -f sha=<full sha>  # rollback
```

The optional `sha` input takes a full 40-character commit SHA; empty means the head of `main`. Before it logs in to Azure it checks that the SHA is a full lowercase SHA and on `main`. Then, as the build identity, it builds `portfolio-backend` and `portfolio-web` for that commit in ACR (`scripts/build-push.sh <sha>`, exported with `git archive`, tagged with the full SHA and `:latest`); an image that already exists for the commit is skipped, so a second run of the same SHA, or a rollback, builds nothing. Before it changes any app it checks that **both** images exist. Then, as the deploy identity, it rolls `ca-portfolio-backend` and `ca-portfolio-web`, locks the two new tags against the registry purge, unlocks the tags the apps ran before, waits until both new revisions are `Provisioned`, and writes the deployed images to the run summary.

### Rollback

Rollback is the same button with an older SHA whose images still exist (it rebuilds an image only if the purge already removed it). See also [operations.md](operations.md).

### One-time setup

This needs rights to create identities and assign roles, and admin on the GitHub repo. Run it **before** the first Deploy after the build moved into the workflow, or the build step fails at the Azure login (the build identity is now trusted for the `production` environment):

```bash
./scripts/setup-github-apps-deploy.sh
```

It creates two managed identities: `id-portfolio-gh-build` (builds and pushes images) and `id-portfolio-gh-deploy` (rolls the two apps). Both are trusted only for the `production` environment; the script removes the build identity's older credential that trusted any workflow on `main`. It makes sure `production` only admits `main`, and stores the Azure IDs the workflows read as repo secrets (identifiers, not credentials, but the logs of this public repo are public and a secret's value is masked there). No credential is stored in GitHub. Re-running it changes nothing.

### Registry purge

Old images are removed by a weekly registry task that only touches `portfolio-backend` and `portfolio-web`: full-SHA tags older than 30 days, always keeping the newest 10 older ones, never a locked tag or `:latest`. Set it up once:

```bash
./scripts/setup-acr-purge.sh            # locks what is running, dry run only
./scripts/setup-acr-purge.sh --create   # after reading the dry run: weekly task
```

### Limits

- The registry is in legacy permission mode, which cannot scope pushes by repository: the deploy identity's `AcrPush` also lets it push, and the build identity can push registry-wide.
- The apps are updated one at a time. If the second update fails, the apps run different versions until you press the button again with the right SHA.
- `infra/deploy.sh` defaults its image tag to your local `HEAD`. After a deploy from GitHub, run it as `./infra/deploy.sh <deployed-sha>` so a Bicep run does not roll the apps to another commit's images.
- ACR Tasks build time is billed, and a build runs once per deployed commit. Check it in Cost Management against the monthly budget.
- `scripts/ship.sh` still works as the laptop fallback.

## Deploy the MCP tools (Azure Function App)

The **Deploy functions** workflow publishes the Function App (`func-portfolio-mcp-tools`) from a commit on `main`, without the laptop or `func`. It runs only when you start it (Actions tab, or `gh workflow run deploy-functions.yml --ref main`), never on a merge. The optional `sha` input takes a full 40-character commit SHA; empty means the head of `main`.

```bash
gh workflow run deploy-functions.yml --ref main                  # head of main
gh workflow run deploy-functions.yml --ref main -f sha=<full sha>  # rollback
```

Before it logs in to Azure it checks that the SHA is a full lowercase SHA, is on `main`, and has `mcp-tools/` and `content/site-content.json`. It then copies `content/site-content.json` into `mcp-tools/content/` like `deploy-mcp-tools.sh` does, zips `mcp-tools/`, and pushes the zip with `az functionapp deployment source config-zip --build-remote true`. The run ends by waiting until the Function App lists its functions and prints them in the run summary.

### Rollback

Press the button with an older SHA. Rollback rebuilds the dependencies from the old commit's `mcp-tools/requirements.txt` (pinned exactly, so an old SHA gets the same versions again). Flex Consumption has no deployment slots, so a bad deploy is fixed by deploying the previous SHA.

### One-time setup

This needs rights to create identities and assign roles, and admin on the GitHub repo:

```bash
./scripts/setup-github-deploy.sh
```

It creates the managed identity `id-portfolio-mcp-gh-deploy` with Website Contributor on `func-portfolio-mcp-tools` only, and a federated credential that trusts only the `production` environment of this repo. It restricts that environment to `main` and stores the Azure IDs the workflow reads as repo secrets (masked in the public run logs). No credential is stored in GitHub. Re-running it changes nothing.

### Limits

- The workflow covers the Function App's code only. The two container apps (`scripts/ship.sh`), infra (`infra/deploy.sh`) and the Function key stay manual.
- `scripts/deploy-mcp-tools.sh` still works as the laptop fallback.

## PR review

`.github/workflows/claude-review.yml` posts an AI security-first review when a PR is opened and on every push to it. The repo owner can also request one by commenting `@claude`. Each review also runs a documentation check: it flags docs that contradict the change, were not updated, or hold stale names, paths or counts, or it says "Docs: current". It is comment-only and authenticates with the `CLAUDE_CODE_OAUTH_TOKEN` repo secret. For when that token expires and how to renew it, see [expirations.md](expirations.md).
