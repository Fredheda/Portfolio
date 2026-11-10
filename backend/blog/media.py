import logging
import re
from collections.abc import Iterable
from typing import Protocol

import httpx
from starlette.background import BackgroundTask
from starlette.responses import JSONResponse, Response, StreamingResponse

logger = logging.getLogger("blog.media")

ALLOWED_TYPES = frozenset(
    {
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "image/avif",
        "image/svg+xml",
        "video/mp4",
        "video/webm",
        "audio/mpeg",
        "audio/mp4",
        "audio/ogg",
        "audio/webm",
    }
)
RANGE = re.compile(r"bytes=\d*-\d*\Z")
# Per read between chunks, not for the whole transfer.
BLOB_TIMEOUT = httpx.Timeout(30.0, connect=10.0)
FORWARD = ("content-length", "content-range", "accept-ranges")
SAFETY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    # An SVG opened directly must not run script or load anything.
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cache-Control": "private, max-age=300",
}


def _fixed(status: int) -> Response:
    error = "not_found" if status == 404 else "blog_unavailable"
    return JSONResponse({"error": error}, status_code=status)


class MediaStreamer(Protocol):
    """What the routes need from the proxy (the route tests pass a fake)."""

    async def stream(self, url: str, range_header: str | None) -> Response: ...


class MediaProxy:
    """Streams a blob from a short-lived signed URL the read API handed us, so
    the browser never sees the URL. The URL comes from another service: it is
    still checked (https, exact host, default port, no userinfo) and not
    redirected."""

    def __init__(
        self,
        http: httpx.AsyncClient,
        allowed_hosts: Iterable[str],
        allow_insecure: bool = False,
    ) -> None:
        self._http = http
        self._hosts = frozenset(host.lower() for host in allowed_hosts)
        # Browser tests only: their fake blob store speaks plain http on a
        # loopback port. Production never sets it.
        self._insecure = allow_insecure

    def _target(self, url: str) -> httpx.URL | None:
        try:
            target = httpx.URL(url)
        except httpx.InvalidURL:
            return None
        if target.userinfo:
            return None
        if target.scheme != "https" and not (
            self._insecure and target.scheme == "http"
        ):
            return None
        if target.port is not None and not self._insecure:
            return None
        if target.host.lower() not in self._hosts:
            return None
        return target

    async def stream(self, url: str, range_header: str | None) -> Response:
        target = self._target(url)
        if target is None:
            logger.error("blog media url rejected")
            return _fixed(503)
        headers = {"Accept-Encoding": "identity"}
        if range_header is not None and RANGE.match(range_header):
            headers["Range"] = range_header
        try:
            upstream = await self._http.send(
                self._http.build_request(
                    "GET", target, headers=headers, timeout=BLOB_TIMEOUT
                ),
                stream=True,
            )
        except httpx.TransportError as exc:
            logger.warning("blog media request failed: %s", type(exc).__name__)
            return _fixed(503)
        if upstream.status_code not in (200, 206, 416):
            logger.warning("blog media status %s", upstream.status_code)
            await upstream.aclose()
            return _fixed(404 if upstream.status_code == 404 else 503)
        content_type = (
            upstream.headers.get("content-type", "").split(";")[0].strip().lower()
        )
        if content_type not in ALLOWED_TYPES:
            logger.warning("blog media type refused")
            await upstream.aclose()
            return _fixed(503)
        headers_out = {
            name: value
            for name, value in upstream.headers.items()
            if name.lower() in FORWARD
        }
        headers_out.update(SAFETY_HEADERS)
        return StreamingResponse(
            upstream.aiter_raw(),
            status_code=upstream.status_code,
            media_type=content_type,
            headers=headers_out,
            background=BackgroundTask(upstream.aclose),
        )
