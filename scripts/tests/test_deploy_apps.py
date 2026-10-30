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
