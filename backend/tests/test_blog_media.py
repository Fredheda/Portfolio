import httpx
import pytest
from blog.media import MediaProxy

URL = "https://acct.blob.core.windows.net/blog-published/posts/p/v1/media/m1.png?sig=SECRET"


def make(handler, **kwargs):
    http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return MediaProxy(http, {"acct.blob.core.windows.net"}, **kwargs)


async def read(response):
    return b"".join([chunk async for chunk in response.body_iterator])


@pytest.mark.asyncio
async def test_streams_an_allowed_blob_with_the_safety_headers():
    seen = []

    def handler(request):
        seen.append(request)
        # A stream, not content=: a response built from content is already
        # consumed, and the proxy streams (aiter_raw) like a real network response.
        return httpx.Response(
            200,
            stream=httpx.ByteStream(b"x" * 10),
            headers={"content-type": "image/png", "accept-ranges": "bytes"},
        )

    response = await make(handler).stream(URL, None)
    assert response.status_code == 200
    assert response.media_type == "image/png"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert "sandbox" in response.headers["content-security-policy"]
    assert response.headers["cross-origin-resource-policy"] == "same-origin"
    assert response.headers["accept-ranges"] == "bytes"
    assert await read(response) == b"x" * 10
    assert seen[0].headers["accept-encoding"] == "identity"


@pytest.mark.asyncio
async def test_a_range_request_is_forwarded_and_answered_with_206():
    seen = []

    def handler(request):
        seen.append(request)
        return httpx.Response(
            206,
            content=b"y" * 4,
            headers={"content-type": "video/mp4", "content-range": "bytes 0-3/100"},
        )

    response = await make(handler).stream(URL, "bytes=0-3")
    assert seen[0].headers["range"] == "bytes=0-3"
    assert response.status_code == 206
    assert response.headers["content-range"] == "bytes 0-3/100"


@pytest.mark.parametrize(
    "value", ["garbage", "bytes=0-1,5-9", "bytes=a-b", "items=0-1"]
)
@pytest.mark.asyncio
async def test_a_malformed_range_is_not_forwarded(value):
    seen = []

    def handler(request):
        seen.append(request)
        return httpx.Response(200, content=b"z", headers={"content-type": "image/png"})

    await make(handler).stream(URL, value)
    assert "range" not in seen[0].headers


@pytest.mark.parametrize(
    "url",
    [
        "https://evil.example/x.png",
        "http://acct.blob.core.windows.net/x.png",
        "https://user:pw@acct.blob.core.windows.net/x.png",
        "https://acct.blob.core.windows.net:8443/x.png",
        "https://acct.blob.core.windows.net.evil.example/x.png",
        "https://127.0.0.1/x.png",
        "not a url",
        "",
    ],
)
@pytest.mark.asyncio
async def test_urls_outside_the_allowlist_are_never_fetched(url):
    seen = []

    def handler(request):
        seen.append(request)
        return httpx.Response(200, content=b"x", headers={"content-type": "image/png"})

    response = await make(handler).stream(url, None)
    assert response.status_code == 503
    assert seen == []


@pytest.mark.asyncio
async def test_a_type_that_could_run_script_is_refused():
    def handler(request):
        return httpx.Response(
            200, content=b"<script>1</script>", headers={"content-type": "text/html"}
        )

    response = await make(handler).stream(URL, None)
    assert response.status_code == 503
    assert b"script" not in response.body


@pytest.mark.asyncio
async def test_upstream_errors_become_fixed_answers_without_upstream_text():
    missing = await make(
        lambda r: httpx.Response(404, text="BlobNotFound SECRET")
    ).stream(URL, None)
    broken = await make(
        lambda r: httpx.Response(500, text="SECRET-STORAGE-ERROR")
    ).stream(URL, None)
    assert (missing.status_code, broken.status_code) == (404, 503)
    assert b"SECRET" not in bytes(missing.body) + bytes(broken.body)


@pytest.mark.asyncio
async def test_redirects_are_not_followed():
    seen = []

    def handler(request):
        seen.append(request)
        return httpx.Response(302, headers={"location": "https://evil.example/"})

    response = await make(handler).stream(URL, None)
    assert response.status_code == 503
    assert len(seen) == 1


@pytest.mark.asyncio
async def test_a_transport_error_is_a_fixed_503():
    def handler(request):
        raise httpx.ConnectError("SECRET host name")

    response = await make(handler).stream(URL, None)
    assert response.status_code == 503
    assert b"SECRET" not in response.body
