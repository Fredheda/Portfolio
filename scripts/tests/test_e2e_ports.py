"""The e2e ports have one JavaScript source (frontend/e2e/env.js). The Python
test servers keep their own fallback values for a run started by hand; this
test fails when one drifts from env.js, or when the Playwright config stops
passing the same variable names on."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENV_JS = (ROOT / "frontend" / "e2e" / "env.js").read_text()
CONFIG = (ROOT / "frontend" / "playwright.config.js").read_text()
BACKEND_SERVER = (ROOT / "e2e_backend" / "backend_server.py").read_text()
MCP_SERVER = (ROOT / "e2e_backend" / "mcp_server.py").read_text()


def js_default(name: str) -> int:
    match = re.search(rf"port\('{name}', (\d+)\)", ENV_JS)
    assert match, f"env.js has no port('{name}', <default>)"
    return int(match.group(1))


def py_default(source: str, name: str) -> int:
    match = re.search(rf'os\.environ\.get\("{name}", "(\d+)"\)', source)
    assert match, f"no os.environ.get(\"{name}\", \"<default>\")"
    return int(match.group(1))


def test_the_backend_server_default_matches_env_js() -> None:
    assert py_default(BACKEND_SERVER, "E2E_BACKEND_PORT") == js_default("E2E_BACKEND_PORT")


def test_both_python_servers_default_the_mcp_port_like_env_js() -> None:
    expected = js_default("E2E_MCP_PORT")
    assert py_default(BACKEND_SERVER, "E2E_MCP_PORT") == expected
    assert py_default(MCP_SERVER, "E2E_MCP_PORT") == expected


def test_the_config_passes_the_same_variable_names_to_the_python_servers() -> None:
    for name, constant in (
        ("E2E_MCP_PORT", "MCP_PORT"),
        ("E2E_BACKEND_PORT", "BACKEND_PORT"),
    ):
        assert f"{name}: String({constant})" in CONFIG, name
        assert f'"{name}"' in BACKEND_SERVER or f'"{name}"' in MCP_SERVER, name
