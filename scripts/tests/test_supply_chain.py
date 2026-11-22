"""Supply-chain pins: cooldowns, exact versions, digests. Text-based: no YAML or TOML library in CI. Bumps: docs/development.md, "Dependencies"."""

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# No hashes: an owner decision for this file; any other `-r` file needs hashes.
PINNED_REQUIREMENTS = {"mcp-tools/requirements.txt"}
COMPILE_SCRIPT = "scripts/compile-mcp-tools-requirements.sh"
PIP_SOURCES = (
    COMPILE_SCRIPT,
    "backend/Dockerfile",
    ".github/workflows/ci.yml",
    "scripts/ci-local.sh",
)
PIP_WINDOW = "PIP_UPLOADED_PRIOR_TO=P14D"
PIP_PIN = re.compile(r"\bpip==([0-9][0-9.]*)")
PINNED_LINE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*==[0-9][A-Za-z0-9.+!]*$")

EXACT = re.compile(r"[A-Za-z0-9_.-]+==[0-9][0-9A-Za-z.]*")
INSTALL = re.compile(r"\b(?:pip|pipx) (install|inject)\b(.*)")
ACTION = re.compile(r"uses:\s+\S+@[0-9a-f]{40}\s+#\s+v[0-9]")
POETRY_PIN = re.compile(r"poetry==([0-9][0-9.]*)")
NPX_DOWNLOAD = re.compile(r"\bnpx\s+(?:-y\b|--yes\b|[^\s@-]\S*@\S)")


def tracked(*patterns: str) -> list[Path]:
    out = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", *patterns],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return [ROOT / line for line in out.splitlines()]


def workflows() -> list[Path]:
    return tracked(".github/workflows/*.yml")


def install_sources() -> list[Path]:
    return [*workflows(), *tracked("scripts/*.sh", "**/Dockerfile")]


def lines(path: Path):
    for number, line in enumerate(path.read_text().splitlines(), 1):
        if not line.lstrip().startswith("#"):
            yield number, line


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def test_every_npm_project_has_the_cooldown() -> None:
    projects = {p.parent for p in tracked("**/package.json")}
    assert projects == {ROOT / "frontend"}, (
        "a new npm project needs this test and a cooldown"
    )
    for project in projects:
        npmrc = project / ".npmrc"
        text = npmrc.read_text() if npmrc.exists() else ""
        assert "min-release-age=14" in text.splitlines(), rel(npmrc)


def test_every_poetry_project_has_the_cooldown() -> None:
    projects = {p.parent for p in tracked("**/pyproject.toml")}
    assert projects == {ROOT / "backend", ROOT / "data"}, (
        "a new Poetry project needs a cooldown"
    )
    for project in projects:
        poetry_toml = project / "poetry.toml"
        text = poetry_toml.read_text() if poetry_toml.exists() else ""
        assert "[solver]" in text.splitlines(), rel(poetry_toml)
        assert "min-release-age = 14" in text.splitlines(), rel(poetry_toml)


def test_no_cooldown_exclusion_is_committed() -> None:
    files = tracked("**/.npmrc", "**/poetry.toml")
    assert files, "no cooldown files found; the scan is stale"
    for path in files:
        assert "min-release-age-exclude" not in path.read_text(), rel(path)


def test_every_action_is_pinned_by_commit() -> None:
    seen = 0
    offenders = []
    for path in workflows():
        for number, line in lines(path):
            if "uses:" not in line or re.search(r"uses:\s+\./", line):
                continue
            seen += 1
            if not ACTION.search(line):
                offenders.append(f"{rel(path)}:{number}: {line.strip()}")
    assert seen >= 30, "too few uses: lines found; the scan is stale"
    assert offenders == []


def test_pip_and_pipx_installs_are_exact() -> None:
    seen = 0
    offenders = []
    for path in install_sources():
        for number, line in lines(path):
            match = INSTALL.search(line)
            if not match:
                continue
            seen += 1
            verb, rest = match.groups()
            args = re.split(r"&&|;|\|", rest.replace("\\", " "))[0].split()
            targets = []
            after_r = False
            for arg in args:
                arg = arg.strip("\"'")
                if arg.startswith("-"):
                    after_r = arg in ("-r", "--requirement")
                elif after_r:
                    after_r = False
                    if (
                        arg not in PINNED_REQUIREMENTS
                        and "--hash" not in (ROOT / arg).read_text()
                    ):
                        offenders.append(f"{rel(path)}:{number}: unhashed -r {arg}")
                else:
                    targets.append(arg)
            if verb == "inject":
                targets = targets[1:]  # the first name is the environment
            offenders += [
                f"{rel(path)}:{number}: {t}" for t in targets if not EXACT.fullmatch(t)
            ]
    assert seen >= 8, "too few install lines found; the scan is stale"
    assert offenders == []


def test_one_poetry_version_in_ci_and_the_backend_image() -> None:
    pins = []
    for path in [*workflows(), ROOT / "backend" / "Dockerfile"]:
        pins += [
            (rel(path), v) for _, line in lines(path) for v in POETRY_PIN.findall(line)
        ]
    assert len(pins) >= 5, (
        f"expected 3 in ci.yml, 1 in security.yml, 1 in the Dockerfile: {pins}"
    )
    assert len({v for _, v in pins}) == 1, pins


def test_the_backend_image_installs_poetry_inside_the_pip_window() -> None:
    dockerfile = (ROOT / "backend" / "Dockerfile").read_text()
    assert re.search(r"pip install --no-cache-dir pip==[0-9][0-9.]*", dockerfile)
    assert re.search(
        r"PIP_UPLOADED_PRIOR_TO=P14D pip install [^\n]*poetry==", dockerfile
    )


def test_no_npx_download() -> None:
    offenders = [
        f"{rel(path)}:{number}: {line.strip()}"
        for path in [*workflows(), *tracked("scripts/*.sh")]
        for number, line in lines(path)
        if NPX_DOWNLOAD.search(line)
    ]
    assert offenders == []


def test_the_scan_covers_the_known_install_files() -> None:
    names = {rel(p) for p in install_sources()}
    assert {
        ".github/workflows/ci.yml",
        ".github/workflows/security.yml",
        "scripts/ci-local.sh",
        "backend/Dockerfile",
        "frontend/Dockerfile",
    } <= names


DIGEST = re.compile(r"@sha256:[0-9a-f]{64}")
VALUE_FLAGS = {
    "-v",
    "--volume",
    "-w",
    "--workdir",
    "-e",
    "--env",
    "--name",
    "-u",
    "--user",
}
FROM = re.compile(r"\s*FROM\s+(\S+)(?:\s+AS\s+(\S+))?", re.IGNORECASE)


def docker_run_image(line: str) -> str | None:
    match = re.search(r"\bdocker run\b(.*)", line)
    if not match:
        return None
    skip = False
    for arg in match[1].replace("\\", " ").split():
        if skip:
            skip = False
        elif arg in VALUE_FLAGS:
            skip = True
        elif not arg.startswith("-"):
            return arg
    return None


def test_every_docker_image_is_pinned_by_digest() -> None:
    seen = 0
    offenders = []
    for path in [*tracked("**/Dockerfile"), *workflows(), *tracked("scripts/*.sh")]:
        stages: set[str] = set()
        for number, line in lines(path):
            images = []
            if match := FROM.match(line):
                image, stage = match.groups()
                if image not in stages:  # FROM <earlier stage> needs no digest
                    images.append(image)
                if stage:
                    stages.add(stage)
            if image := docker_run_image(line):
                images.append(image)
            for image in images:
                seen += 1
                if not DIGEST.search(image):
                    offenders.append(f"{rel(path)}:{number}: {image}")
    assert seen >= 6, "too few image references found; the scan is stale"
    assert offenders == []


def test_pinned_requirements_hold_only_exact_pins() -> None:
    offenders = []
    for name in sorted(PINNED_REQUIREMENTS):
        entries = [
            line.strip()
            for line in (ROOT / name).read_text().splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        ]
        assert entries, f"{name} pins nothing"
        offenders += [f"{name}: {e}" for e in entries if not PINNED_LINE.match(e)]
    assert offenders == []


def test_the_compile_script_applies_the_14_day_window() -> None:
    script = ROOT / COMPILE_SCRIPT
    assert script.exists(), f"{COMPILE_SCRIPT} is missing"
    assert PIP_WINDOW in script.read_text()


def test_the_compile_script_the_image_and_ci_pin_the_same_pip() -> None:
    def pins(name: str) -> set[str]:
        path = ROOT / name
        return set(PIP_PIN.findall(path.read_text())) if path.exists() else set()

    per_file = {name: pins(name) for name in PIP_SOURCES}
    assert all(len(found) == 1 for found in per_file.values()), per_file
    assert len(set().union(*per_file.values())) == 1, per_file


def test_pytest_installs_apply_the_14_day_window() -> None:
    offenders = [
        f"{rel(path)}:{number}: {line.strip()}"
        for path in install_sources()
        for number, line in lines(path)
        if "pytest==" in line and " install " in line and PIP_WINDOW not in line
    ]
    assert offenders == []


def test_the_compile_script_keeps_the_committed_versions() -> None:
    script = (ROOT / COMPILE_SCRIPT).read_text()
    assert 'constraints="mcp-tools/requirements.txt"' in script
    assert '--constraint "$constraints"' in script
    direct = script.split("DIRECT=(", 1)[1].split(")", 1)[0]
    assert "==" not in direct, "DIRECT holds floors; the committed file holds versions"
