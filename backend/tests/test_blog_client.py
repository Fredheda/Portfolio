import logging
from datetime import UTC, datetime

import httpx
import pytest
from blog.cache import ResponseCache
from blog.client import HttpBlogClient
from blog.errors import BlogNotFound, BlogUnavailable

from tests.blog_fixtures import AUDIO_LINK, MEDIA_LINK, POST, POST_LIST


class Clock:
    def __init__(self):
        self.now = 1_000.0

    def __call__(self):
        return self.now


class Tokens:
    def __init__(self):
        self.n = 1
        self.invalidated = 0

    async def get(self):
        return f"t{self.n}"

    def invalidate(self):
        self.n += 1
        self.invalidated += 1


def make(handler, tokens=None):
    clock = Clock()
    http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    client = HttpBlogClient(
        "https://blog.example",
        tokens or Tokens(),
        http,
        cache=ResponseCache(clock=clock),
        retry_delay=0,
        clock=clock,
    )
    return client, clock


def link(clock, seconds, base=MEDIA_LINK):
    expires = datetime.fromtimestamp(clock.now + seconds, UTC).isoformat()
    return {**base, "expiresAt": expires}


@pytest.mark.asyncio
async def test_list_posts_sends_the_bearer_token_to_the_v1_path():
    seen = []

    def handler(request):
        seen.append(request)
        return httpx.Response(200, json=POST_LIST)

    client, _ = make(handler)
    result = await client.list_posts(5, "abc", "maths")
    request = seen[0]
    assert request.url.path == "/v1/posts"
    assert dict(request.url.params) == {"limit": "5", "cursor": "abc", "tag": "maths"}
    assert request.headers["authorization"] == "Bearer t1"
    assert result.items[0].slug == "hello-world"


@pytest.mark.asyncio
async def test_repeat_calls_come_from_memory_and_stale_ones_are_revalidated():
    sent = []

    def handler(request):
        etag = request.headers.get("if-none-match")
        sent.append(etag)
        if etag == '"v1"':
            return httpx.Response(304)
        return httpx.Response(200, json=POST_LIST, headers={"ETag": '"v1"'})

    client, clock = make(handler)
    first = await client.list_posts(20, None, None)
    assert await client.list_posts(20, None, None) is first
    assert sent == [None]
    clock.now += 61
    assert await client.list_posts(20, None, None) is first  # 304: same object
    assert sent == [None, '"v1"']
    clock.now += 30
    await client.list_posts(20, None, None)
    assert len(sent) == 2  # the 304 made it fresh again


@pytest.mark.asyncio
async def test_when_the_api_is_down_the_cached_copy_is_served_then_it_gives_up(caplog):
    state = {"down": False}

    def handler(request):
        if state["down"]:
            return httpx.Response(503, text="SECRET-UPSTREAM-TEXT")
        return httpx.Response(200, json=POST_LIST)

    client, clock = make(handler)
    first = await client.list_posts(20, None, None)
    clock.now += 120
    state["down"] = True
    with caplog.at_level(logging.DEBUG):
        assert await client.list_posts(20, None, None) is first
        clock.now += 2000  # past the stale window
        with pytest.raises(BlogUnavailable) as raised:
            await client.list_posts(20, None, None)
    assert str(raised.value) == ""
    assert "SECRET-UPSTREAM-TEXT" not in caplog.text


@pytest.mark.asyncio
async def test_a_missing_post_is_not_retried():
    sent = []

    def handler(request):
        sent.append(request)
        return httpx.Response(404, json={"title": "no such post"})

    client, _ = make(handler)
    with pytest.raises(BlogNotFound):
        await client.get_post("nope")
    assert len(sent) == 1


@pytest.mark.asyncio
async def test_one_transport_error_is_retried():
    sent = []

    def handler(request):
        sent.append(request)
        if len(sent) == 1:
            raise httpx.ConnectError("boom")
        return httpx.Response(200, json=POST)

    client, _ = make(handler)
    assert (await client.get_post("hello-world")).slug == "hello-world"
    assert len(sent) == 2


@pytest.mark.asyncio
async def test_a_401_drops_the_token_and_retries_once_with_a_new_one():
    tokens = Tokens()
    seen = []

    def handler(request):
        seen.append(request.headers["authorization"])
        if request.headers["authorization"] == "Bearer t1":
            return httpx.Response(401)
        return httpx.Response(200, json=POST)

    client, _ = make(handler, tokens)
    await client.get_post("hello-world")
    assert seen == ["Bearer t1", "Bearer t2"]
    assert tokens.invalidated == 1


@pytest.mark.asyncio
async def test_a_403_means_not_approved_and_is_not_retried():
    sent = []

    def handler(request):
        sent.append(request)
        return httpx.Response(403)

    client, _ = make(handler)
    with pytest.raises(BlogUnavailable):
        await client.get_post("hello-world")
    assert len(sent) == 1


@pytest.mark.parametrize("slug", ["../secrets", "A", "a/b", "", "a" * 101, "a\n"])
@pytest.mark.asyncio
async def test_an_invalid_slug_never_builds_a_request(slug):
    sent = []

    def handler(request):
        sent.append(request)
        return httpx.Response(200, json=POST)

    client, _ = make(handler)
    with pytest.raises(BlogNotFound):
        await client.get_post(slug)
    with pytest.raises(BlogNotFound):
        await client.media_link(slug, "m1")
    with pytest.raises(BlogNotFound):
        await client.audio_link(slug)
    assert sent == []


@pytest.mark.asyncio
async def test_an_invalid_media_id_never_builds_a_request():
    sent = []
    client, _ = make(lambda request: sent.append(request) or httpx.Response(200))
    with pytest.raises(BlogNotFound):
        await client.media_link("hello-world", "../x")
    assert sent == []


@pytest.mark.asyncio
async def test_a_body_that_breaks_the_contract_is_unavailable_not_half_rendered():
    client, _ = make(
        lambda request: httpx.Response(200, json={"items": [{"slug": "x"}]})
    )
    with pytest.raises(BlogUnavailable):
        await client.list_posts(20, None, None)


@pytest.mark.asyncio
async def test_media_links_are_reused_until_a_minute_before_they_expire():
    sent = []
    holder = {}

    def handler(request):
        sent.append(request)
        return httpx.Response(200, json=link(holder["clock"], 600))

    client, clock = make(handler)
    holder["clock"] = clock
    first = await client.media_link("hello-world", "m1")
    assert sent[0].url.path == "/v1/media/m1"
    assert dict(sent[0].url.params) == {"post": "hello-world"}
    assert await client.media_link("hello-world", "m1") is first
    assert len(sent) == 1
    clock.now += 545  # 55 s left, inside the 60 s margin
    await client.media_link("hello-world", "m1")
    assert len(sent) == 2


@pytest.mark.asyncio
async def test_audio_link_uses_the_post_audio_path():
    sent = []
    holder = {}

    def handler(request):
        sent.append(request)
        return httpx.Response(200, json=link(holder["clock"], 600, AUDIO_LINK))

    client, clock = make(handler)
    holder["clock"] = clock
    result = await client.audio_link("hello-world")
    assert sent[0].url.path == "/v1/posts/hello-world/audio"
    assert result.durationSec == 61.5
