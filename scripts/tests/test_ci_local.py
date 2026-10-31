"""scripts/ci-local.sh is the gate before `gh pr ready`: it must run every
check that ci.yml runs, so a green local run predicts a green CI run."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CI_YML = ROOT / ".github" / "workflows" / "ci.yml"
CI_LOCAL = ROOT / "scripts" / "ci-local.sh"

# ci.yml commands that run differently on a laptop, with what the script runs
# instead (None = CI-only plumbing with no local equivalent).
DIFFERENT_LOCALLY = {
    'pipx install "poetry>=2.0,<3.0"': None,  # the developer has Poetry
    "pip install pytest==9.1.1": None,  # the developer has pytest
    'changed-areas.sh "origin/${{ github.base_ref }}"': None,  # PR-only plumbing
    "npx playwright install --with-deps chromium": "npx playwright install chromium",
}


def ci_run_commands() -> list[str]:
    return re.findall(r"^\s*(?:- )?run: (.+)$", CI_YML.read_text(), re.MULTILINE)


def is_known_difference(command: str) -> bool:
    return any(known in command for known in DIFFERENT_LOCALLY)


def test_every_ci_command_is_in_the_local_script() -> None:
    script = CI_LOCAL.read_text()
    commands = ci_run_commands()
    assert commands, "no run: lines found in ci.yml; the parser is stale"
    missing = [c for c in commands if not is_known_difference(c) and c not in script]
    assert missing == []


def test_the_local_script_runs_the_known_differences_its_own_way() -> None:
    script = CI_LOCAL.read_text()
    for local in filter(None, DIFFERENT_LOCALLY.values()):
        assert local in script


def test_the_local_script_stops_at_the_first_error() -> None:
    assert "set -euo pipefail" in CI_LOCAL.read_text()


def test_the_local_script_runs_e2e_last() -> None:
    script = CI_LOCAL.read_text()
    assert script.rindex("npm run e2e") > script.rindex("npm run build")
