"""The blog read chain must give a cold read API time to wake. The web server
gives up on the backend after its header timeout; the backend asks the read
API with a read timeout and one retry. Both attempts, and the pause between
them, have to fit inside the proxy's wait, or the proxy answers 503 while the
backend is still working. Text-based: it reads the numbers from the sources."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SERVER_JS = (ROOT / "frontend" / "server.js").read_text()
CLIENT_PY = (ROOT / "backend" / "blog" / "client.py").read_text()

# A cold read API takes about 30 s to answer its first request.
COLD_START_SECONDS = 30


def proxy_header_wait() -> float:
    match = re.search(r"controller\.abort\(\), ([0-9_]+)\)", SERVER_JS)
    assert match, "the proxy's header timeout is not where this test looks"
    return int(match[1].replace("_", "")) / 1000


def backend_read_timeout() -> float:
    match = re.search(r"TIMEOUT = httpx\.Timeout\(([0-9.]+),", CLIENT_PY)
    assert match, "the backend's read timeout is not where this test looks"
    return float(match[1])


def backend_retry_delay() -> float:
    match = re.search(r"retry_delay: float = ([0-9.]+)", CLIENT_PY)
    assert match, "the backend's retry delay is not where this test looks"
    return float(match[1])


def test_the_proxy_waits_longer_than_a_cold_start() -> None:
    assert proxy_header_wait() >= 2 * COLD_START_SECONDS


def test_both_backend_attempts_fit_inside_the_proxy_wait() -> None:
    worst = 2 * backend_read_timeout() + backend_retry_delay()
    assert worst < proxy_header_wait(), f"{worst} s of backend waiting"


def test_the_backend_attempts_together_outlast_a_cold_start() -> None:
    # The first attempt may time out while the API wakes; the retry then lands
    # on a warm one. Shrinking the read timeout too far would give up first.
    assert 2 * backend_read_timeout() + backend_retry_delay() >= COLD_START_SECONDS
