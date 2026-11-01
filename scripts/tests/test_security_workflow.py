"""Shape of security.yml: stable job ids, no push trigger, draft-first, which
jobs block and which only advise. Text-based: the CI test env has no YAML
library."""

from pathlib import Path

SECURITY_YML = (
    Path(__file__).resolve().parents[2] / ".github" / "workflows" / "security.yml"
)
JOBS = ("gitleaks", "pip-audit", "npm-audit", "bandit", "codeql", "workflow-lint")
RUNS_ON_DRAFTS = ("gitleaks", "workflow-lint")
ADVISORY_ON_PRS = ("pip-audit", "npm-audit")


def job_block(job: str) -> str:
    text = SECURITY_YML.read_text()
    block = text.split(f"\n  {job}:\n", 1)[1]
    # The block ends at the next job id (two-space key) or end of file.
    lines = []
    for line in block.splitlines():
        if (
            line.startswith("  ")
            and not line.startswith("   ")
            and line.strip().endswith(":")
        ):
            break
        lines.append(line)
    return "\n".join(lines)


def test_security_has_the_six_stable_job_ids() -> None:
    text = SECURITY_YML.read_text()
    for job in JOBS:
        assert f"\n  {job}:\n" in text, job


def test_security_has_no_push_trigger_and_a_weekly_schedule() -> None:
    text = SECURITY_YML.read_text()
    assert "push:" not in text
    assert "types: [opened, reopened, synchronize, ready_for_review]" in text
    assert "schedule:" in text and "cron:" in text


def test_only_gitleaks_and_workflow_lint_run_on_drafts() -> None:
    for job in JOBS:
        has_draft_skip = "!github.event.pull_request.draft" in job_block(job)
        assert has_draft_skip == (job not in RUNS_ON_DRAFTS), job


def test_audits_are_advisory_on_prs_and_the_rest_are_not() -> None:
    advisory = "continue-on-error: ${{ github.event_name == 'pull_request' }}"
    for job in JOBS:
        assert (advisory in job_block(job)) == (job in ADVISORY_ON_PRS), job


def test_only_codeql_gets_security_events_write() -> None:
    text = SECURITY_YML.read_text()
    assert text.count("security-events: write") == 1
    assert "security-events: write" in job_block("codeql")
    assert "permissions:\n  contents: read\n" in text


def test_no_third_party_actions() -> None:
    uses = [
        line.split("uses:", 1)[1].strip().split("@")[0]
        for line in SECURITY_YML.read_text().splitlines()
        if "uses:" in line
    ]
    assert uses
    for action in uses:
        assert action.startswith(("actions/", "github/")), action


def test_tools_are_pinned() -> None:
    text = SECURITY_YML.read_text()
    for pinned in (
        "ghcr.io/gitleaks/gitleaks:v8.30.1",
        "pip-audit==2.10.1",
        "bandit==1.9.4",
        "rhysd/actionlint:1.7.12",
    ):
        assert pinned in text, pinned
