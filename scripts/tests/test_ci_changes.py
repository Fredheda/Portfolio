"""Tests for scripts/changed-areas.sh, which decides whether a PR needs the
heavy CI jobs. A PR that only touches documentation prints `code=false`;
anything else prints `code=true`."""

import subprocess
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "changed-areas.sh"


def git(repo: Path, *args: str) -> None:
    subprocess.run(
        ["git", "-c", "user.name=t", "-c", "user.email=t@example.test", *args],
        cwd=repo,
        check=True,
        capture_output=True,
    )


@pytest.fixture
def repo(tmp_path: Path) -> Path:
    git(tmp_path, "init", "-q", "-b", "main")
    for name in ("README.md", "docs/a.md", "backend/x.py", ".github/workflows/ci.yml"):
        path = tmp_path / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("base\n")
    git(tmp_path, "add", "-A")
    git(tmp_path, "commit", "-q", "-m", "base")
    git(tmp_path, "switch", "-q", "-c", "pr")
    return tmp_path


def classify(repo: Path) -> str:
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "--allow-empty", "-m", "change")
    result = subprocess.run(
        ["bash", str(SCRIPT), "main"],
        cwd=repo,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def test_only_markdown_and_docs_is_not_code(repo: Path) -> None:
    (repo / "README.md").write_text("changed\n")
    (repo / "docs" / "new.md").write_text("new\n")
    (repo / "deployment").mkdir()
    (repo / "deployment" / "x.txt").write_text("new\n")
    assert classify(repo) == "code=false"


def test_markdown_outside_the_docs_folders_is_code(repo: Path) -> None:
    # backend/agent/system_prompt.md is read at runtime, so a prompt-only PR
    # must run the backend tests and e2e.
    prompt = repo / "backend" / "agent" / "system_prompt.md"
    prompt.parent.mkdir(parents=True)
    prompt.write_text("changed\n")
    assert classify(repo) == "code=true"


def test_a_code_file_next_to_docs_is_code(repo: Path) -> None:
    (repo / "README.md").write_text("changed\n")
    (repo / "backend" / "x.py").write_text("changed\n")
    assert classify(repo) == "code=true"


def test_a_workflow_only_change_is_code(repo: Path) -> None:
    (repo / ".github" / "workflows" / "ci.yml").write_text("changed\n")
    assert classify(repo) == "code=true"


def test_a_deleted_doc_is_not_code(repo: Path) -> None:
    (repo / "docs" / "a.md").unlink()
    assert classify(repo) == "code=false"


def test_a_deleted_code_file_is_code(repo: Path) -> None:
    (repo / "backend" / "x.py").unlink()
    assert classify(repo) == "code=true"


def test_an_empty_diff_is_not_code(repo: Path) -> None:
    assert classify(repo) == "code=false"


CI_YML = Path(__file__).resolve().parents[2] / ".github" / "workflows" / "ci.yml"
HEAVY_JOBS = ("backend", "mcp-tools-test", "deploy-scripts-test", "frontend", "e2e")


def test_ci_runs_on_pull_requests_only_and_builds_nothing() -> None:
    text = CI_YML.read_text()
    assert "pull_request:" in text
    assert "push:" not in text
    assert "az acr build" not in text and "build-push.sh" not in text


def test_every_heavy_job_skips_on_docs_only_and_runs_if_changes_fails() -> None:
    # `code != 'false'` (not `== 'true'`) so an empty output, from a failed
    # `changes` job, still runs everything; `!cancelled()` stops the implicit
    # success() that would otherwise skip the job when `changes` failed.
    text = CI_YML.read_text()
    condition = "if: ${{ !cancelled() && needs.changes.outputs.code != 'false'"
    for job in HEAVY_JOBS:
        block = text.split(f"\n  {job}:\n", 1)[1].split("\n  # ", 1)[0]
        assert "needs: changes" in block, job
        assert condition in block, job
    assert text.count(condition) == len(HEAVY_JOBS)


NOT_DRAFT = "github.event.pull_request.draft == false"


def test_ci_starts_on_ready_for_review_so_gh_pr_ready_runs_the_heavy_jobs() -> None:
    assert (
        "types: [opened, reopened, synchronize, ready_for_review]" in CI_YML.read_text()
    )


def test_only_e2e_and_the_frontend_build_wait_for_a_ready_pr() -> None:
    text = CI_YML.read_text()
    e2e = text.split("\n  e2e:\n", 1)[1]
    assert NOT_DRAFT in e2e.split("\n    runs-on:", 1)[0]
    frontend = text.split("\n  frontend:\n", 1)[1].split("\n  # ", 1)[0]
    build = frontend.split("- name: Production build", 1)[1]
    assert NOT_DRAFT in build.split("run:", 1)[0]
    # Everything else runs on drafts too.
    assert text.count(NOT_DRAFT) == 2


def test_the_review_runs_on_ready_prs_only() -> None:
    text = (CI_YML.parent / "claude-review.yml").read_text()
    assert "types: [opened, synchronize, ready_for_review]" in text
    review = text.split("\n  review:\n", 1)[1].split("\n  claude:\n", 1)[0]
    assert NOT_DRAFT in review.split("\n    permissions:", 1)[0]
    # The owner's @claude comment still works on a draft.
    claude = text.split("\n  claude:\n", 1)[1]
    assert NOT_DRAFT not in claude


def test_an_unknown_base_fails_loudly(repo: Path) -> None:
    result = subprocess.run(
        ["bash", str(SCRIPT), "no-such-ref"],
        cwd=repo,
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "ERROR" in result.stderr
