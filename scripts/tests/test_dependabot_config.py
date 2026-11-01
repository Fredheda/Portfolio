"""Shape of .github/dependabot.yml: every manifest directory covered, monthly
grouped PRs with a cooldown. Text-based: the CI test env has no YAML library."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / ".github" / "dependabot.yml"


def entries() -> list[str]:
    text = CONFIG.read_text()
    parts = re.split(r"\n  - package-ecosystem: ", text)
    return ["package-ecosystem: " + p for p in parts[1:]]


def entry(ecosystem: str) -> str:
    found = [e for e in entries() if e.startswith(f"package-ecosystem: {ecosystem}\n")]
    assert len(found) == 1, ecosystem
    return found[0]


def dirs(block: str) -> set[str]:
    return set(re.findall(r"^\s+(?:directory: |- )(/[\w/-]*)\s*$", block, re.MULTILINE))


def test_every_manifest_directory_is_covered() -> None:
    assert dirs(entry("pip")) == {"/backend", "/data", "/mcp-tools"}
    assert dirs(entry("npm")) == {"/frontend"}
    assert dirs(entry("github-actions")) == {"/"}
    assert dirs(entry("docker")) == {"/backend", "/frontend"}


def test_covered_directories_hold_the_manifests() -> None:
    assert (ROOT / "backend" / "pyproject.toml").exists()
    assert (ROOT / "data" / "pyproject.toml").exists()
    assert (ROOT / "mcp-tools" / "requirements.txt").exists()
    assert (ROOT / "frontend" / "package.json").exists()
    assert (ROOT / "backend" / "Dockerfile").exists()
    assert (ROOT / "frontend" / "Dockerfile").exists()


def test_every_ecosystem_is_monthly_with_cooldown_label_and_one_open_pr() -> None:
    assert len(entries()) == 4
    for block in entries():
        assert "interval: monthly" in block, block[:40]
        assert "default-days: 14" in block, block[:40]
        assert "- dependencies" in block, block[:40]
        assert "open-pull-requests-limit: 1" in block, block[:40]


def test_every_ecosystem_groups_all_updates_into_one_pr() -> None:
    for block in entries():
        assert 'patterns:\n          - "*"' in block, block[:40]


def test_npm_and_docker_ignore_major_bumps() -> None:
    for ecosystem in ("npm", "docker"):
        block = entry(ecosystem)
        assert 'dependency-name: "*"' in block, ecosystem
        assert 'update-types: ["version-update:semver-major"]' in block, ecosystem
