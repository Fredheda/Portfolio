"""Images must listen on 0.0.0.0, or ingress and probes cannot reach the app. Text-based: no Docker runs here."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_the_frontend_image_listens_on_all_interfaces() -> None:
    runtime = (ROOT / "frontend" / "Dockerfile").read_text().rsplit("\nFROM ", 1)[1]
    assert re.search(r"(?m)^ENV HOST=0\.0\.0\.0$", runtime)


def test_the_backend_image_passes_all_interfaces_to_uvicorn() -> None:
    dockerfile = (ROOT / "backend" / "Dockerfile").read_text()
    assert re.search(r'(?m)^CMD \[.*"--host", "0\.0\.0\.0".*\]$', dockerfile)
