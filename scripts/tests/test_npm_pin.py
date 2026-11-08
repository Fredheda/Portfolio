"""npm is pinned exactly where the frontend is built or audited: every stage of
frontend/Dockerfile that starts from a Node image, and every workflow job that
uses actions/setup-node. Text-based: the CI test env has no YAML library.
The patch number is not hardcoded; the pins must agree and be npm 12."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCKERFILE = ROOT / "frontend" / "Dockerfile"
WORKFLOWS = [
    ROOT / ".github" / "workflows" / "ci.yml",
    ROOT / ".github" / "workflows" / "security.yml",
]
PIN = re.compile(r"npm install -g npm@(\d+\.\d+\.\d+)")
NPM_USE = re.compile(r"\bnpm (ci|test|run|audit)\b|\bnpx\b")


def docker_stages() -> list[str]:
    parts = re.split(r"(?m)^(?=FROM )", DOCKERFILE.read_text())
    return [p for p in parts if p.startswith("FROM node:")]


def workflow_jobs() -> list[tuple[str, str]]:
    """(file name and job id, job text) for each job that uses setup-node."""
    found = []
    for path in WORKFLOWS:
        text = path.read_text()
        parts = re.split(r"(?m)^  ([a-z0-9-]+):\n", text)
        # parts: preamble, id1, body1, id2, body2, ...
        for job_id, body in zip(parts[1::2], parts[2::2]):
            if "actions/setup-node" in body:
                found.append((f"{path.name}:{job_id}", body))
    return found


def test_the_expected_jobs_use_setup_node() -> None:
    ids = {name for name, _ in workflow_jobs()}
    assert ids == {"ci.yml:frontend", "ci.yml:e2e", "security.yml:npm-audit"}


def test_every_node_docker_stage_pins_npm_before_using_it() -> None:
    stages = docker_stages()
    assert len(stages) == 2
    for stage in stages:
        pin = PIN.search(stage)
        assert pin, f"stage has no npm pin:\n{stage}"
        use = NPM_USE.search(stage)
        assert use and pin.start() < use.start(), "npm used before the pin"
        assert "npm --version" in stage, "stage must print the npm version"


def test_every_setup_node_job_pins_npm_after_setup_and_before_use() -> None:
    for name, body in workflow_jobs():
        pin = PIN.search(body)
        assert pin, f"{name} has no npm pin"
        assert body.index("actions/setup-node") < pin.start(), name
        use = NPM_USE.search(body)
        assert use and pin.start() < use.start(), f"{name}: npm used before the pin"


def test_all_pins_are_the_same_npm_12_version() -> None:
    texts = [DOCKERFILE.read_text()] + [p.read_text() for p in WORKFLOWS]
    versions = {v for t in texts for v in PIN.findall(t)}
    assert len(versions) == 1, f"pins differ: {sorted(versions)}"
    assert versions.pop().startswith("12."), "npm major must be 12"
