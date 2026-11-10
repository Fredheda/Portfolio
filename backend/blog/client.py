import asyncio
import logging
import time
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Protocol, TypeVar
from urllib.parse import urlencode

import httpx
from pydantic import BaseModel, ValidationError

from blog.cache import ResponseCache
from blog.errors import BlogAuthError, BlogNotFound, BlogUnavailable
from blog.models import MEDIA_ID, SLUG, AudioLink, MediaLink, Post, PostList
from blog.token import TokenProvider

logger = logging.getLogger("blog.client")

# Generous: ca-blogapi scales to zero and a cold start takes several seconds.
TIMEOUT = httpx.Timeout(30.0, connect=10.0)
MAX_BODY_BYTES = 2_000_000
RETRY_STATUS = {429, 502, 503, 504}
LINK_MARGIN_SECONDS = 60
MAX_LINKS = 256

T = TypeVar("T", bound=BaseModel)


class BlogClient(Protocol):
    """What the routes need. The one place to swap if the blog backend changes."""

    async def list_posts(
        self, limit: int, cursor: str | None, tag: str | None
    ) -> PostList: ...

    async def get_post(self, slug: str) -> Post: ...

    async def media_link(self, slug: str, media_id: str) -> MediaLink: ...

    async def audio_link(self, slug: str) -> AudioLink: ...


def _check_slug(slug: str) -> None:
    if not SLUG.match(slug):
        raise BlogNotFound()


def _check_media_id(media_id: str) -> None:
    if not MEDIA_ID.match(media_id):
        raise BlogNotFound()


def _epoch(value: str) -> float:
    moment = datetime.fromisoformat(value)
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=UTC)
    return moment.timestamp()


class HttpBlogClient:
    def __init__(
        self,
        base_url: str,
        tokens: TokenProvider,
        http: httpx.AsyncClient,
        cache: ResponseCache | None = None,
        retry_delay: float = 1.0,
        clock: Callable[[], float] = time.time,
    ) -> None:
        self._base = base_url.rstrip("/") + "/v1"
        self._tokens = tokens
        self._http = http
        self._cache = cache if cache is not None else ResponseCache()
        self._retry_delay = retry_delay
        self._clock = clock
        # Short-lived signed URLs stay in this process only, until a minute
        # before they expire (the spec: clients cache descriptors, not URLs;
        # these never reach a browser).
        self._links: dict[tuple, tuple[BaseModel, float]] = {}

    async def list_posts(
        self, limit: int, cursor: str | None, tag: str | None
    ) -> PostList:
        params = {"limit": str(limit)}
        if cursor:
            params["cursor"] = cursor
        if tag:
            params["tag"] = tag
        return await self._cached(PostList, "/posts", params)

    async def get_post(self, slug: str) -> Post:
        _check_slug(slug)
        return await self._cached(Post, f"/posts/{slug}", {})

    async def media_link(self, slug: str, media_id: str) -> MediaLink:
        _check_slug(slug)
        _check_media_id(media_id)
        return await self._link(
            MediaLink, f"/media/{media_id}", {"post": slug}, ("media", slug, media_id)
        )

    async def audio_link(self, slug: str) -> AudioLink:
        _check_slug(slug)
        return await self._link(AudioLink, f"/posts/{slug}/audio", {}, ("audio", slug))

    async def _cached(self, model: type[T], path: str, params: dict[str, str]) -> T:
        key = f"{path}?{urlencode(sorted(params.items()))}"
        entry, fresh = self._cache.get(key)
        if entry is not None and fresh:
            return entry.value
        headers = {"If-None-Match": entry.etag} if entry and entry.etag else {}
        try:
            response = await self._send(path, params, headers)
        except BlogUnavailable:
            if entry is not None:
                logger.warning("blog api unavailable: serving the cached copy")
                return entry.value
            raise
        if response.status_code == 304 and entry is not None:
            self._cache.touch(key)
            return entry.value
        value = self._parse(model, response)
        self._cache.put(key, value, response.headers.get("ETag"))
        return value

    async def _link(
        self, model: type[T], path: str, params: dict[str, str], key: tuple
    ) -> T:
        hit = self._links.get(key)
        if hit is not None and hit[1] > self._clock():
            return hit[0]  # type: ignore[return-value]
        response = await self._send(path, params, {})
        link = self._parse(model, response)
        try:
            usable_until = _epoch(link.expiresAt) - LINK_MARGIN_SECONDS  # type: ignore[attr-defined]
        except ValueError:
            logger.warning("blog api sent an unreadable expiry")
            raise BlogUnavailable() from None
        if len(self._links) >= MAX_LINKS:
            self._links.pop(next(iter(self._links)))
        self._links[key] = (link, usable_until)
        return link

    async def _send(
        self, path: str, params: dict[str, str], headers: dict[str, str]
    ) -> httpx.Response:
        outcome = "none"
        token_dropped = False
        for attempt in range(2):
            try:
                token = await self._tokens.get()
            except BlogAuthError:
                raise BlogUnavailable() from None
            try:
                response = await self._http.get(
                    self._base + path,
                    params=params,
                    headers={
                        **headers,
                        "Accept": "application/json",
                        "Authorization": f"Bearer {token}",
                    },
                    timeout=TIMEOUT,
                )
            except httpx.TransportError as exc:
                outcome = type(exc).__name__
            else:
                status = response.status_code
                if status in (200, 304):
                    return response
                if status == 404:
                    raise BlogNotFound()
                outcome = str(status)
                if status == 401 and not token_dropped:
                    token_dropped = True
                    self._tokens.invalidate()
                    continue
                if status not in RETRY_STATUS:
                    break
            if attempt == 0:
                await asyncio.sleep(self._retry_delay)
        logger.warning("blog api request failed: %s", outcome)
        raise BlogUnavailable()

    def _parse(self, model: type[T], response: httpx.Response) -> T:
        if len(response.content) > MAX_BODY_BYTES:
            logger.warning("blog api response too large")
            raise BlogUnavailable()
        try:
            return model.model_validate(response.json())
        except (ValueError, ValidationError):
            logger.warning("blog api response did not match v1")
            raise BlogUnavailable() from None
