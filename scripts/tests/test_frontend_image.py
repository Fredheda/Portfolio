"""The runtime image of the web app copies server.js, not the whole source
tree (frontend/Dockerfile). A local module that server.js imports must be
copied too, or the container fails at start while every CI job, which runs
server.js from the checkout, passes. Text-based, like test_npm_pin.py."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FRONTEND = ROOT / "frontend"
SERVER = (FRONTEND / "server.js").read_text()
RUNTIME_STAGE = (FRONTEND / "Dockerfile").read_text().rsplit("\nFROM ", 1)[1]

LOCAL_IMPORT = re.compile(r"""^import\s[^;]*?from\s+['"]\./([^'"]+)['"]""", re.M)
COPIED_FILE = re.compile(r"^COPY (?!--from)(\S+) \./\1$", re.M)


def test_every_local_module_server_js_imports_is_copied_into_the_runtime_image() -> None:
    imported = set(LOCAL_IMPORT.findall(SERVER))
    copied = set(COPIED_FILE.findall(RUNTIME_STAGE))
    assert "server.js" in copied, "the runtime stage should copy server.js"
    for module in imported:
        assert (FRONTEND / module).is_file(), f"server.js imports a missing file: {module}"
    assert imported <= copied, f"not copied into the image: {sorted(imported - copied)}"
