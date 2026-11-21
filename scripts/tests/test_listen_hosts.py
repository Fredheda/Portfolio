"""The container images listen on all interfaces. Local servers listen on
loopback by default (tests: backend/tests/test_listen_address.py and the
`server` e2e project); the frontend image sets HOST=0.0.0.0 and the backend
image passes --host 0.0.0.0 to uvicorn, so Container Apps ingress and probes
can reach them. If an image lost that setting the app would answer only inside
its own container. Text-based: no Docker or server runs here."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_the_frontend_image_listens_on_all_interfaces() -> None:
    runtime = (ROOT / "frontend" / "Dockerfile").read_text().rsplit("\nFROM ", 1)[1]
    assert re.search(r"(?m)^ENV HOST=0\.0\.0\.0$", runtime)


def test_the_backend_image_passes_all_interfaces_to_uvicorn() -> None:
    dockerfile = (ROOT / "backend" / "Dockerfile").read_text()
    assert re.search(r'(?m)^CMD \[.*"--host", "0\.0\.0\.0".*\]$', dockerfile)
