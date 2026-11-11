"""A fake blog read API v1 for the browser tests, served by the fake MCP
server's process (routes under /blog-api). It answers like the contract in
docs/shared/specs/2026-11-08-blog-studio.md section 5: a Bearer token is
required, lists carry an ETag, media is a descriptor with a signed-URL-like
link, and the blob route supports Range. It records each call so a test can
see what the backend sent. The responses contain a storage path and an
unknown field on purpose: the backend must not pass them on."""

import os
import re
from datetime import UTC, datetime, timedelta

from starlette.requests import Request
from starlette.responses import JSONResponse, PlainTextResponse, Response
from starlette.routing import Route

PORT = os.environ.get("E2E_MCP_PORT", "8211")
TOKEN = "e2e-blog-token"
FENCE = "`" * 3
PNG = b"\x89PNG\r\n\x1a\n" + bytes(range(56))  # 64 bytes; only the bytes matter here

CALLS: list[dict] = []
FAIL = {"remaining": 0}

SUMMARY = {
    "postId": "01JABCDEFGHJKMNPQRSTVWXYZ0",
    "slug": "hello-world",
    "title": "Hello world",
    "summary": "A first post.",
    "tags": ["maths", "python"],
    "publishedAt": "2026-11-10T08:00:00Z",
    "updatedAt": "2026-11-10T08:00:00Z",
    "readingTimeMinutes": 4,
    "coverMediaId": "m1",
    "hasAudio": False,
    "futureField": {"added": "in v1.1"},
}
BODY = (
    "# Hello\n\nEuler: $e^{i\\pi}+1=0$\n\n"
    f"{FENCE}python\nprint('hi')\n{FENCE}\n\n![A pixel](media:m1)\n"
)
POST = {
    **SUMMARY,
    "body": BODY,
    "version": 1,
    "media": [
        {
            "id": "m1",
            "kind": "image",
            "mime": "image/png",
            "bytes": len(PNG),
            "width": 1,
            "height": 1,
            "alt": "A pixel",
            "blobPath": "blog-published/posts/x/v1/media/m1.png",
        }
    ],
    "audio": None,
}


def _gate(request: Request) -> Response | None:
    """Records the call; answers 401 without the token and 500 while failing."""
    CALLS.append(
        {
            "path": request.url.path,
            "authorized": request.headers.get("authorization") == f"Bearer {TOKEN}",
            "ifNoneMatch": request.headers.get("if-none-match"),
        }
    )
    if request.headers.get("authorization") != f"Bearer {TOKEN}":
        return JSONResponse({"title": "unauthorized"}, status_code=401)
    if FAIL["remaining"] > 0:
        FAIL["remaining"] -= 1
        return JSONResponse(
            {"title": "planted failure SECRET-UPSTREAM"}, status_code=500
        )
    return None


async def posts(request: Request) -> Response:
    if (early := _gate(request)) is not None:
        return early
    etag = '"posts-v1"'
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304)
    return JSONResponse(
        {"items": [SUMMARY], "nextCursor": None}, headers={"ETag": etag}
    )


async def post(request: Request) -> Response:
    if (early := _gate(request)) is not None:
        return early
    if request.path_params["slug"] != "hello-world":
        return JSONResponse({"title": "not found"}, status_code=404)
    return JSONResponse(POST)


async def media(request: Request) -> Response:
    if (early := _gate(request)) is not None:
        return early
    expires = (datetime.now(UTC) + timedelta(minutes=10)).isoformat()
    return JSONResponse(
        {
            "url": f"http://127.0.0.1:{PORT}/blog-blob/m1",
            "expiresAt": expires,
            "contentType": "image/png",
            "bytes": len(PNG),
        }
    )


async def blob(request: Request) -> Response:
    match = re.fullmatch(r"bytes=(\d*)-(\d*)", request.headers.get("range", ""))
    if match:
        start = int(match[1] or 0)
        end = int(match[2]) if match[2] else len(PNG) - 1
        return Response(
            PNG[start : end + 1],
            status_code=206,
            media_type="image/png",
            headers={
                "Content-Range": f"bytes {start}-{end}/{len(PNG)}",
                "Accept-Ranges": "bytes",
            },
        )
    return Response(PNG, media_type="image/png", headers={"Accept-Ranges": "bytes"})


async def calls(request: Request) -> Response:
    return JSONResponse(CALLS)


async def reset(request: Request) -> Response:
    CALLS.clear()
    FAIL["remaining"] = 0
    return PlainTextResponse("ok")


async def fail(request: Request) -> Response:
    FAIL["remaining"] = int(request.query_params.get("count", "1"))
    return PlainTextResponse("ok")


def routes() -> list[Route]:
    return [
        Route("/blog-api/v1/posts", posts),
        Route("/blog-api/v1/posts/{slug}", post),
        Route("/blog-api/v1/media/{media_id}", media),
        Route("/blog-blob/{media_id}", blob),
        Route("/__blog_calls", calls),
        Route("/__blog_reset", reset, methods=["POST"]),
        Route("/__blog_fail", fail, methods=["POST"]),
    ]
