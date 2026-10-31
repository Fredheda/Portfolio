"""Tests for the scripts behind the build-on-merge and `Deploy apps` pipeline.

The scripts run against fake `az`, `curl` and `gh` programs on PATH. The fake
`az` records every invocation (one line of arguments per call) and answers from
environment variables, so the tests can check what the scripts would do to
Azure without touching it:

- FAKE_MISSING: comma list of `repo:tag`; `az acr repository show` exits 1 for them.
- FAKE_FAIL_UPDATE: container app name whose `az containerapp update` exits 1.
- FAKE_FAIL_LOCK: when set, `az acr repository update` exits 1.
- FAKE_IMAGE_<APP>: image printed for `az containerapp show -n <app> ... image`
  (app name upper-cased, `-` replaced by `_`).
- FAKE_NO_TASK: when set, `az acr task show` exits 1 (the purge task does not exist yet).
- FAKE_PROVISIONING: comma list of revision provisioning states, returned one per
  `az containerapp revision show` call (the last value repeats).
- `az acr build` for the web image also logs `WEB_BUILD content=present|absent`:
  whether frontend/content/site-content.json existed at that moment.
"""

import os
import subprocess
from dataclasses import dataclass
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTENT_FILE = REPO_ROOT / "frontend" / "content" / "site-content.json"

FAKE_AZ = r"""#!/usr/bin/env bash
echo "$*" >> "$FAKE_LOG"
case "$*" in
  "acr build"*)
    echo "BUILD_DIR $PWD" >> "$FAKE_LOG"
    case "$*" in
      *"--image portfolio-web:latest"*)
        if [ -f frontend/content/site-content.json ]; then
          echo "WEB_BUILD content=present" >> "$FAKE_LOG"
        else
          echo "WEB_BUILD content=absent" >> "$FAKE_LOG"
        fi ;;
    esac
    exit 0 ;;
  "acr repository show"*)
    image=$(echo "$*" | sed -E 's/.*--image ([^ ]+).*/\1/')
    case ",${FAKE_MISSING:-}," in *",$image,"*) exit 1 ;; esac
    exit 0 ;;
  "acr repository update"*)
    [ -n "${FAKE_FAIL_LOCK:-}" ] && exit 1
    exit 0 ;;
  "containerapp update"*)
    app=$(echo "$*" | sed -E 's/.*-n ([^ ]+).*/\1/')
    [ "$app" = "${FAKE_FAIL_UPDATE:-}" ] && exit 1
    exit 0 ;;
  "containerapp show"*latestRevisionName*)
    app=$(echo "$*" | sed -E 's/.*-n ([^ ]+).*/\1/')
    echo "$app--rev1"; exit 0 ;;
  "containerapp show"*ingress.fqdn*)
    echo "web.example.test"; exit 0 ;;
  "containerapp show"*image*)
    app=$(echo "$*" | sed -E 's/.*-n ([^ ]+).*/\1/')
    var="FAKE_IMAGE_$(echo "$app" | tr 'a-z-' 'A-Z_')"
    echo "${!var:-}"; exit 0 ;;
  "acr task show"*)
    [ -n "${FAKE_NO_TASK:-}" ] && exit 1
    exit 0 ;;
  "containerapp revision show"*)
    counter="$FAKE_LOG.provisioning"
    n=$(cat "$counter" 2>/dev/null || echo 0)
    IFS=',' read -r -a states <<< "${FAKE_PROVISIONING:-Provisioned}"
    last=$(( ${#states[@]} - 1 ))
    idx=$(( n > last ? last : n ))
    echo "${states[$idx]}"
    echo $(( n + 1 )) > "$counter"
    exit 0 ;;
  "account show"*tenantId*) echo "tenant-1"; exit 0 ;;
  "account show"*) echo "sub-1"; exit 0 ;;
  "acr show"*)
    echo "/subscriptions/sub-1/resourceGroups/rg-chatbot/providers/Microsoft.ContainerRegistry/registries/acrchatbotfredheda"
    exit 0 ;;
  "containerapp show"*"--query id"*)
    app=$(echo "$*" | sed -E 's/.*-n ([^ ]+).*/\1/')
    echo "/subscriptions/sub-1/resourceGroups/rg-chatbot/providers/Microsoft.App/containerApps/$app"
    exit 0 ;;
  "identity show"*principalId*)
    name=$(echo "$*" | sed -E 's/.*-n ([^ ]+).*/\1/')
    echo "principal-$name"; exit 0 ;;
  "identity show"*clientId*)
    name=$(echo "$*" | sed -E 's/.*-n ([^ ]+).*/\1/')
    echo "client-$name"; exit 0 ;;
  "identity show"*"--query id"*)
    name=$(echo "$*" | sed -E 's/.*-n ([^ ]+).*/\1/')
    echo "/subscriptions/sub-1/resourceGroups/rg-chatbot/providers/Microsoft.ManagedIdentity/userAssignedIdentities/$name"
    exit 0 ;;
  "identity show"*)
    [ -n "${FAKE_IDENTITY_EXISTS:-}" ] && exit 0
    exit 1 ;;
  "identity federated-credential show"*)
    [ -n "${FAKE_CREDENTIAL_EXISTS:-}" ] && exit 0
    exit 1 ;;
esac
exit 0
"""

# Stands in for the GitHub Actions OIDC token endpoint.
FAKE_CURL = r"""#!/usr/bin/env bash
echo "$*" >> "$FAKE_LOG.curl"
echo '{"value":"fake-token"}'
"""

# Stands in for the GitHub CLI. Listing the environment's branch policies
# prints FAKE_POLICY_NAMES (`\n` separates names), as the script's --jq filter
# would.
FAKE_GH = r"""#!/usr/bin/env bash
echo "$*" >> "$FAKE_LOG.gh"
case "$*" in
  *"deployment-branch-policies"*)
    case "$*" in *"-X POST"*) exit 0 ;; esac
    printf '%b' "${FAKE_POLICY_NAMES:-}"
    exit 0 ;;
esac
exit 0
"""

ACR = "acrchatbotfredheda"
BACKEND = "portfolio-backend"
WEB = "portfolio-web"
BACKEND_APP = "ca-portfolio-backend"
WEB_APP = "ca-portfolio-web"
SHA = "a" * 40
OLD_SHA = "b" * 40


def head_sha() -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()


@dataclass
class FakeAz:
    log: Path
    bin_dir: Path

    def run(
        self,
        script: str,
        *args: str,
        env: dict[str, str] | None = None,
        cwd: Path = REPO_ROOT,
    ) -> subprocess.CompletedProcess[str]:
        full_env = {
            **os.environ,
            "PATH": f"{self.bin_dir}{os.pathsep}{os.environ['PATH']}",
            "FAKE_LOG": str(self.log),
            **(env or {}),
        }
        return subprocess.run(
            ["bash", str(REPO_ROOT / "scripts" / script), *args],
            cwd=cwd,
            env=full_env,
            capture_output=True,
            text=True,
            timeout=60,
        )

    @property
    def calls(self) -> list[str]:
        if not self.log.exists():
            return []
        return self.log.read_text().splitlines()

    @property
    def gh_calls(self) -> list[str]:
        gh_log = Path(f"{self.log}.gh")
        return gh_log.read_text().splitlines() if gh_log.exists() else []

    @property
    def curl_calls(self) -> list[str]:
        curl_log = Path(f"{self.log}.curl")
        return curl_log.read_text().splitlines() if curl_log.exists() else []


@pytest.fixture
def fake_az(tmp_path: Path) -> FakeAz:
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    for name, body in (("az", FAKE_AZ), ("curl", FAKE_CURL), ("gh", FAKE_GH)):
        tool = bin_dir / name
        tool.write_text(body)
        tool.chmod(0o755)
    return FakeAz(log=tmp_path / "az.log", bin_dir=bin_dir)


def source_and_run(snippet: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["bash", "-c", f"source scripts/lib/images.sh; {snippet}"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=30,
    )


# --- scripts/lib/images.sh ---------------------------------------------------


def test_is_sha_accepts_only_40_lowercase_hex() -> None:
    assert source_and_run(f'is_sha "{SHA}"').returncode == 0
    for bad in ("abc1234", "A" * 40, "latest", "", "g" * 40, "a" * 41):
        assert source_and_run(f'is_sha "{bad}"').returncode != 0, bad


def test_images_lists_the_two_portfolio_images_in_order() -> None:
    result = source_and_run('printf "%s\\n" "${IMAGES[@]}"')
    assert result.returncode == 0, result.stderr
    assert result.stdout.splitlines() == [
        "portfolio-backend|ca-portfolio-backend|backend/Dockerfile|backend",
        "portfolio-web|ca-portfolio-web|frontend/Dockerfile|frontend",
    ]


# --- build-push.sh -----------------------------------------------------------


def build_call(repo: str, dockerfile: str, context: str, sha: str) -> str:
    return (
        f"acr build --registry {ACR} --file {dockerfile} "
        f"--image {repo}:latest --image {repo}:{sha} {context}"
    )


def test_build_push_builds_both_when_none_exist(fake_az: FakeAz) -> None:
    sha = head_sha()
    result = fake_az.run(
        "build-push.sh", env={"FAKE_MISSING": f"{BACKEND}:{sha},{WEB}:{sha}"}
    )
    assert result.returncode == 0, result.stderr
    builds = [c for c in fake_az.calls if c.startswith("acr build")]
    assert builds == [
        build_call(BACKEND, "backend/Dockerfile", "backend", sha),
        build_call(WEB, "frontend/Dockerfile", "frontend", sha),
    ]


def test_build_push_skips_images_that_already_exist(fake_az: FakeAz) -> None:
    result = fake_az.run("build-push.sh")
    assert result.returncode == 0, result.stderr
    assert not any(c.startswith("acr build") for c in fake_az.calls)
    assert "Nothing to build" in result.stdout
    assert f"Skipping {BACKEND}" in result.stdout


def test_build_push_builds_only_the_missing_image(fake_az: FakeAz) -> None:
    sha = head_sha()
    result = fake_az.run("build-push.sh", env={"FAKE_MISSING": f"{WEB}:{sha}"})
    assert result.returncode == 0, result.stderr
    builds = [c for c in fake_az.calls if c.startswith("acr build")]
    assert builds == [build_call(WEB, "frontend/Dockerfile", "frontend", sha)]


def test_build_push_copies_the_content_file_before_the_web_build(
    fake_az: FakeAz,
) -> None:
    sha = head_sha()
    CONTENT_FILE.unlink(missing_ok=True)
    result = fake_az.run("build-push.sh", env={"FAKE_MISSING": f"{WEB}:{sha}"})
    assert result.returncode == 0, result.stderr
    assert "WEB_BUILD content=present" in fake_az.calls
    assert CONTENT_FILE.exists()


def test_build_push_does_not_copy_the_content_file_when_web_exists(
    fake_az: FakeAz,
) -> None:
    sha = head_sha()
    CONTENT_FILE.unlink(missing_ok=True)
    result = fake_az.run("build-push.sh", env={"FAKE_MISSING": f"{BACKEND}:{sha}"})
    assert result.returncode == 0, result.stderr
    assert not CONTENT_FILE.exists()


def parent_sha() -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD~1"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()


def test_build_push_with_a_sha_builds_that_commit_not_the_working_tree(
    fake_az: FakeAz,
) -> None:
    sha = parent_sha()
    CONTENT_FILE.unlink(missing_ok=True)
    result = fake_az.run(
        "build-push.sh", sha, env={"FAKE_MISSING": f"{BACKEND}:{sha},{WEB}:{sha}"}
    )
    assert result.returncode == 0, result.stderr
    builds = [c for c in fake_az.calls if c.startswith("acr build")]
    assert builds == [
        build_call(BACKEND, "backend/Dockerfile", "backend", sha),
        build_call(WEB, "frontend/Dockerfile", "frontend", sha),
    ]
    build_dirs = [
        c.split(" ", 1)[1] for c in fake_az.calls if c.startswith("BUILD_DIR")
    ]
    assert len(build_dirs) == 2
    assert all(Path(d).resolve() != REPO_ROOT for d in build_dirs)
    # The content file is copied into the exported tree, not the caller's.
    assert "WEB_BUILD content=present" in fake_az.calls
    assert not CONTENT_FILE.exists()


def test_build_push_with_a_sha_skips_existing_images(fake_az: FakeAz) -> None:
    sha = parent_sha()
    result = fake_az.run("build-push.sh", sha)
    assert result.returncode == 0, result.stderr
    assert not any(c.startswith("acr build") for c in fake_az.calls)
    assert "Nothing to build" in result.stdout


@pytest.mark.parametrize("bad", ["abc1234", "A" * 40, "c" * 40, "latest"])
def test_build_push_rejects_a_bad_sha_before_any_az_call(
    fake_az: FakeAz, bad: str
) -> None:
    result = fake_az.run("build-push.sh", bad)
    assert result.returncode != 0
    assert "ERROR" in result.stderr
    assert fake_az.calls == []


# --- redeploy.sh -------------------------------------------------------------


def image_env(backend_tag: str, web_tag: str) -> dict[str, str]:
    """What the two apps run right now, as `az containerapp show` reports it."""
    return {
        "FAKE_IMAGE_CA_PORTFOLIO_BACKEND": f"{ACR}.azurecr.io/{BACKEND}:{backend_tag}",
        "FAKE_IMAGE_CA_PORTFOLIO_WEB": f"{ACR}.azurecr.io/{WEB}:{web_tag}",
    }


def update_call(app: str, repo: str, sha: str) -> str:
    return (
        f"containerapp update -n {app} -g rg-chatbot "
        f"--image {ACR}.azurecr.io/{repo}:{sha} --output none"
    )


def lock_call(repo: str, tag: str, locked: bool) -> str:
    return (
        f"acr repository update -n {ACR} --image {repo}:{tag} "
        f"--delete-enabled {'false' if locked else 'true'} "
        "--write-enabled true --output none"
    )


def test_redeploy_rejects_non_sha_before_any_az_call(fake_az: FakeAz) -> None:
    for bad in ("abc123", SHA.upper(), "latest"):
        result = fake_az.run("redeploy.sh", bad)
        assert result.returncode == 2, bad
        assert "not a full 40-character" in result.stderr
    assert fake_az.calls == []


def test_redeploy_refuses_when_one_image_is_missing(fake_az: FakeAz) -> None:
    result = fake_az.run(
        "redeploy.sh", SHA, env={"FAKE_MISSING": f"{WEB}:{SHA}", **image_env("x", "y")}
    )
    assert result.returncode == 1
    assert WEB in result.stderr
    assert BACKEND not in result.stderr
    assert not any(c.startswith("containerapp update") for c in fake_az.calls)


def test_redeploy_names_every_missing_image(fake_az: FakeAz) -> None:
    result = fake_az.run(
        "redeploy.sh", SHA, env={"FAKE_MISSING": f"{BACKEND}:{SHA},{WEB}:{SHA}"}
    )
    assert result.returncode == 1
    assert BACKEND in result.stderr and WEB in result.stderr
    assert not any(c.startswith("containerapp update") for c in fake_az.calls)


def test_redeploy_rolls_both_apps_in_order(fake_az: FakeAz) -> None:
    result = fake_az.run("redeploy.sh", SHA, env=image_env(OLD_SHA, OLD_SHA))
    assert result.returncode == 0, result.stderr
    updates = [c for c in fake_az.calls if c.startswith("containerapp update")]
    assert updates == [
        update_call(BACKEND_APP, BACKEND, SHA),
        update_call(WEB_APP, WEB, SHA),
    ]
    assert "Deployed. https://web.example.test" in result.stdout


def test_redeploy_locks_new_and_unlocks_old_sha_tags(fake_az: FakeAz) -> None:
    result = fake_az.run("redeploy.sh", SHA, env=image_env(OLD_SHA, OLD_SHA))
    assert result.returncode == 0, result.stderr
    calls = fake_az.calls
    for repo in (BACKEND, WEB):
        assert lock_call(repo, SHA, True) in calls
        assert lock_call(repo, OLD_SHA, False) in calls
    # The lock calls happen after both apps have been rolled.
    last_update = max(
        i for i, c in enumerate(calls) if c.startswith("containerapp update")
    )
    first_lock = min(
        i for i, c in enumerate(calls) if c.startswith("acr repository update")
    )
    assert first_lock > last_update


def test_redeploy_never_unlocks_latest_or_the_same_sha(fake_az: FakeAz) -> None:
    result = fake_az.run("redeploy.sh", SHA, env=image_env("latest", SHA))
    assert result.returncode == 0, result.stderr
    unlocks = [c for c in fake_az.calls if "--delete-enabled true" in c]
    assert unlocks == []


def test_redeploy_failed_update_changes_no_locks(fake_az: FakeAz) -> None:
    result = fake_az.run(
        "redeploy.sh",
        SHA,
        env={"FAKE_FAIL_UPDATE": WEB_APP, **image_env(OLD_SHA, OLD_SHA)},
    )
    assert result.returncode != 0
    assert not any(c.startswith("acr repository update") for c in fake_az.calls)


def test_redeploy_reports_a_lock_failure_but_says_the_apps_are_rolled(
    fake_az: FakeAz,
) -> None:
    result = fake_az.run(
        "redeploy.sh", SHA, env={"FAKE_FAIL_LOCK": "1", **image_env(OLD_SHA, OLD_SHA)}
    )
    assert result.returncode != 0
    assert "The apps ARE rolled" in result.stderr


def test_redeploy_uses_the_given_sha_and_never_asks_git(fake_az: FakeAz) -> None:
    # A rollback to a commit older than these scripts passes a SHA only.
    env = {"GIT_DIR": "/nonexistent", **image_env(OLD_SHA, OLD_SHA)}
    result = fake_az.run("redeploy.sh", SHA, env=env)
    assert result.returncode == 0, result.stderr


# --- wait-healthy.sh ---------------------------------------------------------


def test_wait_healthy_passes_when_all_provisioned(fake_az: FakeAz) -> None:
    result = fake_az.run("wait-healthy.sh", "5", "0")
    assert result.returncode == 0, result.stderr
    assert f"{BACKEND_APP}: {BACKEND_APP}--rev1 is Provisioned" in result.stdout
    assert f"{WEB_APP}: {WEB_APP}--rev1 is Provisioned" in result.stdout


def test_wait_healthy_fails_fast_on_a_failed_revision(fake_az: FakeAz) -> None:
    result = fake_az.run(
        "wait-healthy.sh", "5", "0", env={"FAKE_PROVISIONING": "Failed"}
    )
    assert result.returncode == 1
    assert "failed to provision" in result.stderr


def test_wait_healthy_waits_through_provisioning(fake_az: FakeAz) -> None:
    result = fake_az.run(
        "wait-healthy.sh",
        "30",
        "0",
        env={"FAKE_PROVISIONING": "Provisioning,Provisioning,Provisioned"},
    )
    assert result.returncode == 0, result.stderr


def test_wait_healthy_times_out(fake_az: FakeAz) -> None:
    result = fake_az.run(
        "wait-healthy.sh", "1", "0.2", env={"FAKE_PROVISIONING": "Provisioning"}
    )
    assert result.returncode == 1
    assert "timed out" in result.stderr


# --- resolve-image-sha.sh ----------------------------------------------------


def git(repo: Path, *args: str) -> str:
    result = subprocess.run(
        [
            "git",
            "-c",
            "user.name=test",
            "-c",
            "user.email=test@example.test",
            "-c",
            "commit.gpgsign=false",
            *args,
        ],
        cwd=repo,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


@dataclass
class GitRepo:
    path: Path
    b: str  # head of origin/main
    c: str  # on a side branch, not on main


@pytest.fixture
def git_repo(tmp_path: Path) -> GitRepo:
    repo = tmp_path / "repo"
    repo.mkdir()
    git(repo, "init", "-q", "-b", "main")
    (repo / "README.md").write_text("readme\n")
    git(repo, "add", ".")
    git(repo, "commit", "-q", "-m", "b")
    b = git(repo, "rev-parse", "HEAD")
    git(repo, "update-ref", "refs/remotes/origin/main", b)
    git(repo, "switch", "-q", "-c", "side")
    (repo / "side.txt").write_text("side\n")
    git(repo, "add", ".")
    git(repo, "commit", "-q", "-m", "c")
    return GitRepo(path=repo, b=b, c=git(repo, "rev-parse", "HEAD"))


def resolve(repo: GitRepo, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["bash", str(REPO_ROOT / "scripts" / "resolve-image-sha.sh"), *args],
        cwd=repo.path,
        capture_output=True,
        text=True,
        timeout=30,
    )


def test_resolve_image_sha_defaults_to_head_of_main(git_repo: GitRepo) -> None:
    result = resolve(git_repo)
    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == git_repo.b


def test_resolve_image_sha_trims_whitespace_and_newline(git_repo: GitRepo) -> None:
    result = resolve(git_repo, f" {git_repo.b}\n")
    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == git_repo.b


@pytest.mark.parametrize("bad", ["abc1234", "UPPER", "main", "HEAD~1", "g" * 40])
def test_resolve_image_sha_rejects_short_uppercase_and_garbage(
    git_repo: GitRepo, bad: str
) -> None:
    value = git_repo.b.upper() if bad == "UPPER" else bad
    result = resolve(git_repo, value)
    assert result.returncode == 1
    assert "is not a full 40-character" in result.stderr


def test_resolve_image_sha_rejects_a_sha_the_repo_does_not_know(
    git_repo: GitRepo,
) -> None:
    result = resolve(git_repo, "0" * 40)
    assert result.returncode == 1
    assert "is not a commit" in result.stderr


def test_resolve_image_sha_rejects_sha_not_on_main(git_repo: GitRepo) -> None:
    result = resolve(git_repo, git_repo.c)
    assert result.returncode == 1
    assert "is not on main" in result.stderr


# --- setup-github-apps-deploy.sh ---------------------------------------------

REGISTRY_ID = (
    "/subscriptions/sub-1/resourceGroups/rg-chatbot/providers/"
    "Microsoft.ContainerRegistry/registries/acrchatbotfredheda"
)
BUILD_ID = "id-portfolio-gh-build"
DEPLOY_ID = "id-portfolio-gh-deploy"
GH_REPO = "Fredheda/Portfolio"


def role_assignments(fake_az: FakeAz, identity: str) -> set[tuple[str, str]]:
    """(role, last segment of scope) for every role granted to `identity`."""
    granted = set()
    for call in fake_az.calls:
        if not call.startswith("role assignment create"):
            continue
        if f"--assignee-object-id principal-{identity} " not in call:
            continue
        role = call.split("--role ", 1)[1].split(" --scope ", 1)[0]
        scope = call.split("--scope ", 1)[1].split(" -o none", 1)[0]
        granted.add((role, scope.rsplit("/", 1)[1]))
    return granted


def test_setup_gives_the_build_identity_only_registry_push_and_tasks_rights(
    fake_az: FakeAz,
) -> None:
    result = fake_az.run("setup-github-apps-deploy.sh")
    assert result.returncode == 0, result.stderr
    assert role_assignments(fake_az, BUILD_ID) == {
        ("AcrPush", "acrchatbotfredheda"),
        ("Container Registry Tasks Contributor", "acrchatbotfredheda"),
    }


def test_setup_gives_the_deploy_identity_app_rights_and_nothing_on_other_apps(
    fake_az: FakeAz,
) -> None:
    result = fake_az.run("setup-github-apps-deploy.sh")
    assert result.returncode == 0, result.stderr
    assert role_assignments(fake_az, DEPLOY_ID) == {
        ("AcrPush", "acrchatbotfredheda"),
        ("Managed Identity Operator", "id-portfolio-acrpull"),
        ("Container Apps Contributor", BACKEND_APP),
        ("Container Apps Contributor", WEB_APP),
    }


def test_setup_trusts_the_production_environment_for_both_identities(
    fake_az: FakeAz,
) -> None:
    # The Deploy apps job builds and deploys inside the `production`
    # environment, so both identities are trusted for that subject only.
    result = fake_az.run("setup-github-apps-deploy.sh")
    assert result.returncode == 0, result.stderr
    creds = [
        c for c in fake_az.calls if c.startswith("identity federated-credential create")
    ]
    assert len(creds) == 2
    for identity in (BUILD_ID, DEPLOY_ID):
        call = next(c for c in creds if f"--identity-name {identity} " in c)
        assert "--name github-production" in call
        assert f"--subject repo:{GH_REPO}:environment:production" in call
        assert "--audiences api://AzureADTokenExchange" in call
    assert not any("refs/heads/main" in c for c in creds)


def test_setup_removes_the_old_main_credential_from_the_build_identity(
    fake_az: FakeAz,
) -> None:
    result = fake_az.run(
        "setup-github-apps-deploy.sh", env={"FAKE_CREDENTIAL_EXISTS": "1"}
    )
    assert result.returncode == 0, result.stderr
    deletes = [
        c for c in fake_az.calls if c.startswith("identity federated-credential delete")
    ]
    assert len(deletes) == 1
    assert f"--identity-name {BUILD_ID} " in deletes[0]
    assert "--name github-main" in deletes[0]


def test_setup_deletes_nothing_when_the_old_credential_is_absent(
    fake_az: FakeAz,
) -> None:
    result = fake_az.run("setup-github-apps-deploy.sh")
    assert result.returncode == 0, result.stderr
    assert not any(
        c.startswith("identity federated-credential delete") for c in fake_az.calls
    )


def test_setup_restricts_the_environment_to_main(fake_az: FakeAz) -> None:
    result = fake_az.run("setup-github-apps-deploy.sh")
    assert result.returncode == 0, result.stderr
    put = [
        c
        for c in fake_az.gh_calls
        if f"api -X PUT repos/{GH_REPO}/environments/production" in c
    ]
    assert len(put) == 1
    assert "deployment_branch_policy[custom_branch_policies]=true" in put[0]
    assert any(
        "-X POST" in c and "deployment-branch-policies" in c and "name=main" in c
        for c in fake_az.gh_calls
    )


def test_setup_does_not_add_the_main_policy_twice(fake_az: FakeAz) -> None:
    result = fake_az.run(
        "setup-github-apps-deploy.sh", env={"FAKE_POLICY_NAMES": "main"}
    )
    assert result.returncode == 0, result.stderr
    assert not any("-X POST" in c for c in fake_az.gh_calls)


def test_setup_warns_about_other_branch_policies(fake_az: FakeAz) -> None:
    result = fake_az.run(
        "setup-github-apps-deploy.sh", env={"FAKE_POLICY_NAMES": "main\\nfeature"}
    )
    assert result.returncode == 0, result.stderr
    assert "feature" in result.stderr


def test_setup_twice_creates_nothing_new(fake_az: FakeAz) -> None:
    result = fake_az.run(
        "setup-github-apps-deploy.sh",
        env={"FAKE_IDENTITY_EXISTS": "1", "FAKE_CREDENTIAL_EXISTS": "1"},
    )
    assert result.returncode == 0, result.stderr
    assert not any(c.startswith("identity create") for c in fake_az.calls)
    assert not any(
        c.startswith("identity federated-credential create") for c in fake_az.calls
    )


def test_setup_stores_the_four_ids_as_secrets_so_logs_mask_them(
    fake_az: FakeAz,
) -> None:
    result = fake_az.run("setup-github-apps-deploy.sh")
    assert result.returncode == 0, result.stderr
    for name, value in (
        ("AZURE_TENANT_ID", "tenant-1"),
        ("AZURE_SUBSCRIPTION_ID", "sub-1"),
        ("AZURE_BUILD_CLIENT_ID", f"client-{BUILD_ID}"),
        ("AZURE_APPS_DEPLOY_CLIENT_ID", f"client-{DEPLOY_ID}"),
    ):
        assert f"secret set {name} --body {value} -R {GH_REPO}" in fake_az.gh_calls
    assert not any("variable set" in c for c in fake_az.gh_calls)


def test_workflows_read_the_azure_ids_from_secrets_not_variables() -> None:
    # Variables are printed in clear text in the (public) run logs; secrets
    # are masked.
    workflows = sorted((REPO_ROOT / ".github" / "workflows").glob("*.yml"))
    assert workflows
    for workflow in workflows:
        assert "vars.AZURE_" not in workflow.read_text(), workflow.name
    for name in ("deploy-apps.yml", "deploy-functions.yml"):
        text = (REPO_ROOT / ".github" / "workflows" / name).read_text()
        assert "secrets.AZURE_TENANT_ID" in text, name
        assert "secrets.AZURE_SUBSCRIPTION_ID" in text, name


def test_deploy_workflow_builds_with_the_build_identity_before_the_deploy_login() -> (
    None
):
    text = (REPO_ROOT / ".github" / "workflows" / "deploy-apps.yml").read_text()
    order = [
        text.index("scripts/resolve-image-sha.sh"),
        text.index("secrets.AZURE_BUILD_CLIENT_ID"),
        text.index('scripts/build-push.sh "$SHA"'),
        text.index("Log in to Azure to deploy"),
        text.index("az logout"),
        text.index('scripts/redeploy.sh "$SHA"'),
    ]
    assert order == sorted(order)
    assert "secrets.AZURE_APPS_DEPLOY_CLIENT_ID" in text
    # The build identity is trusted only inside the production environment.
    assert "environment: production" in text


def test_setup_never_touches_the_function_app_variable(fake_az: FakeAz) -> None:
    result = fake_az.run("setup-github-apps-deploy.sh")
    assert result.returncode == 0, result.stderr
    assert not any("AZURE_DEPLOY_CLIENT_ID" in c for c in fake_az.gh_calls)


# --- setup-acr-purge.sh ------------------------------------------------------

TASK = "purge-portfolio-images"


def test_purge_dry_run_locks_running_images_and_creates_no_task(
    fake_az: FakeAz,
) -> None:
    result = fake_az.run("setup-acr-purge.sh", env=image_env(SHA, OLD_SHA))
    assert result.returncode == 0, result.stderr
    assert lock_call(BACKEND, SHA, True) in fake_az.calls
    assert lock_call(WEB, OLD_SHA, True) in fake_az.calls
    runs = [c for c in fake_az.calls if c.startswith("acr run")]
    assert len(runs) == 1 and "--dry-run" in runs[0]
    assert not any(c.startswith("acr task create") for c in fake_az.calls)
    assert "--create" in result.stdout


def test_purge_filters_name_only_the_two_portfolio_sha_patterns(
    fake_az: FakeAz,
) -> None:
    result = fake_az.run("setup-acr-purge.sh", env=image_env(SHA, SHA))
    assert result.returncode == 0, result.stderr
    run_call = next(c for c in fake_az.calls if c.startswith("acr run"))
    # The registry's own name contains "chatbot"; look at the purge command only.
    command = run_call.split("--cmd ", 1)[1]
    assert f"--filter '{BACKEND}:^[0-9a-f]{{40}}$'" in command
    assert f"--filter '{WEB}:^[0-9a-f]{{40}}$'" in command
    assert command.count("--filter") == 2
    for other in ("chatbot", "podcasts", "tfl", "restaurant"):
        assert other not in command
    assert "--include-locked" not in command
    assert "--ago 30d --keep 10 --untagged" in command


def test_purge_skips_locking_a_non_sha_tag(fake_az: FakeAz) -> None:
    result = fake_az.run("setup-acr-purge.sh", env=image_env("latest", SHA))
    assert result.returncode == 0, result.stderr
    assert "not locking portfolio-backend" in result.stdout
    assert not any(
        f"--image {BACKEND}:" in c and "repository update" in c for c in fake_az.calls
    )
    assert lock_call(WEB, SHA, True) in fake_az.calls


def test_purge_create_makes_a_weekly_task_without_dry_run(fake_az: FakeAz) -> None:
    result = fake_az.run(
        "setup-acr-purge.sh",
        "--create",
        env={"FAKE_NO_TASK": "1", **image_env(SHA, SHA)},
    )
    assert result.returncode == 0, result.stderr
    creates = [c for c in fake_az.calls if c.startswith("acr task create")]
    assert len(creates) == 1
    create = creates[0]
    assert f"-n {TASK} -r {ACR}" in create
    assert "--schedule 0 3 * * Sun" in create
    assert "--context /dev/null" in create
    assert "--dry-run" not in create and "--include-locked" not in create
    assert not any(c.startswith("acr task delete") for c in fake_az.calls)


def test_purge_create_replaces_an_existing_task(fake_az: FakeAz) -> None:
    result = fake_az.run("setup-acr-purge.sh", "--create", env=image_env(SHA, SHA))
    assert result.returncode == 0, result.stderr
    kinds = [
        c.split(" ")[2]
        for c in fake_az.calls
        if c.startswith(("acr task show", "acr task delete", "acr task create"))
    ]
    assert kinds == ["show", "delete", "create"]
    assert f"acr task delete -n {TASK} -r {ACR} --yes" in fake_az.calls


def test_purge_rejects_unknown_arguments(fake_az: FakeAz) -> None:
    result = fake_az.run("setup-acr-purge.sh", "--delete-everything")
    assert result.returncode == 2
    assert fake_az.calls == []
