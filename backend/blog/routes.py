import hashlib

from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from starlette.responses import JSONResponse, Response

from blog.client import BlogClient
from blog.errors import BlogNotFound, BlogUnavailable
from blog.media import MediaStreamer

JSON_CACHE = "no-cache"


def _validators(header: str) -> set[str]:
    return {part.strip().removeprefix("W/") for part in header.split(",")}


def _json(result: BaseModel, request: Request) -> Response:
    """The JSON answer with a content ETag. The browser keeps a copy but must
    revalidate on every view, so an unpublished post is gone at the next one."""
    response = JSONResponse(result.model_dump(mode="json"))
    etag = '"' + hashlib.sha256(response.body).hexdigest()[:32] + '"'
    headers = {"Cache-Control": JSON_CACHE, "ETag": etag}
    if etag in _validators(request.headers.get("if-none-match", "")):
        return Response(status_code=304, headers=headers)
    response.headers.update(headers)
    return response


def _failure(exc: Exception) -> Response:
    if isinstance(exc, BlogNotFound):
        return JSONResponse({"error": "not_found"}, status_code=404)
    return JSONResponse({"error": "blog_unavailable"}, status_code=503)


def build_blog_router(client: BlogClient, media: MediaStreamer) -> APIRouter:
    """GET-only JSON and media for Portfolio's own pages and fredbot. Errors
    have fixed bodies; nothing from the blog API's answers is passed on
    except the validated models."""
    router = APIRouter(prefix="/blog")

    @router.get("/posts")
    async def list_posts(
        request: Request,
        limit: int = Query(20, ge=1, le=50),
        cursor: str | None = Query(None, max_length=512),
        tag: str | None = Query(None, max_length=50),
    ) -> Response:
        try:
            result = await client.list_posts(limit, cursor, tag)
        except (BlogNotFound, BlogUnavailable) as exc:
            return _failure(exc)
        return _json(result, request)

    @router.get("/posts/{slug}")
    async def get_post(slug: str, request: Request) -> Response:
        try:
            result = await client.get_post(slug)
        except (BlogNotFound, BlogUnavailable) as exc:
            return _failure(exc)
        return _json(result, request)

    @router.get("/posts/{slug}/media/{media_id}")
    async def get_media(slug: str, media_id: str, request: Request) -> Response:
        try:
            link = await client.media_link(slug, media_id)
        except (BlogNotFound, BlogUnavailable) as exc:
            return _failure(exc)
        return await media.stream(link.url, request.headers.get("range"))

    @router.get("/posts/{slug}/audio")
    async def get_audio(slug: str, request: Request) -> Response:
        try:
            link = await client.audio_link(slug)
        except (BlogNotFound, BlogUnavailable) as exc:
            return _failure(exc)
        return await media.stream(link.url, request.headers.get("range"))

    return router
