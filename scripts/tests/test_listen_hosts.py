"""Local servers listen on loopback; the containers listen on all interfaces.
`python main.py` and `node server.js` read HOST (default 127.0.0.1). The
frontend image sets HOST=0.0.0.0 and the backend image passes --host 0.0.0.0
to uvicorn, so Container Apps ingress and probes can reach them. If an image
lost that setting the app would answer only inside its own container.
Text-based: no Docker or server runs here."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_server_js_listens_on_host_defaulting_to_loopback() -> None:
    source = (ROOT / "frontend" / "server.js").read_text()
    assert "const HOST = process.env.HOST || '127.0.0.1';" in source
    assert "app.listen(PORT, HOST," in source


def test_main_py_has_no_hard_coded_all_interfaces_address() -> None:
    source = (ROOT / "backend" / "main.py").read_text()
    assert 'host="0.0.0.0"' not in source
    assert 'env.get("HOST") or "127.0.0.1"' in source
    assert "uvicorn.run(app, host=host, port=port)" in source


def test_the_frontend_image_listens_on_all_interfaces() -> None:
    runtime = (ROOT / "frontend" / "Dockerfile").read_text().rsplit("\nFROM ", 1)[1]
    assert re.search(r"(?m)^ENV HOST=0\.0\.0\.0$", runtime)


def test_the_backend_image_passes_all_interfaces_to_uvicorn() -> None:
    dockerfile = (ROOT / "backend" / "Dockerfile").read_text()
    assert re.search(r'(?m)^CMD \[.*"--host", "0\.0\.0\.0".*\]$', dockerfile)
