import pytest
from blog.routes import build_blog_router
from fastapi import FastAPI
from fastapi.testclient import TestClient

from tests.blog_fixtures import NOT_FOUND, UNAVAILABLE, FakeClient, FakeMedia


def make():
    client, media = FakeClient(), FakeMedia()
    app = FastAPI()
    app.include_router(build_blog_router(client, media))
    return TestClient(app), client, media


def test_list_passes_its_parameters_and_never_returns_storage_paths():
    web, client, _ = make()
    response = web.get("/blog/posts?limit=3&cursor=abc&tag=maths")
    assert response.status_code == 200
    assert client.calls == [("list", 3, "abc", "maths")]
    assert response.headers["cache-control"] == "private, max-age=60"
    assert response.json()["items"][0]["slug"] == "hello-world"
    assert "futureField" not in response.text


@pytest.mark.parametrize(
    "query",
    ["limit=0", "limit=51", "limit=x", "cursor=" + "a" * 513, "tag=" + "a" * 51],
)
def test_out_of_range_parameters_are_rejected_before_the_client(query):
    web, client, _ = make()
    assert web.get(f"/blog/posts?{query}").status_code == 422
    assert client.calls == []


def test_a_post_has_its_body_and_no_blob_path():
    web, _, _ = make()
    body = web.get("/blog/posts/hello-world").json()
    assert "e^{i\\pi}" in body["body"]
    assert "blobPath" not in str(body)


def test_failures_have_fixed_bodies():
    web, client, _ = make()
    client.error = NOT_FOUND
    missing = web.get("/blog/posts/hello-world")
    client.error = UNAVAILABLE
    down = web.get("/blog/posts/hello-world")
    assert (missing.status_code, missing.json()) == (404, {"error": "not_found"})
    assert (down.status_code, down.json()) == (503, {"error": "blog_unavailable"})


def test_media_is_streamed_from_the_link_the_api_gave_with_the_browsers_range():
    web, client, media = make()
    response = web.get(
        "/blog/posts/hello-world/media/m1", headers={"Range": "bytes=0-9"}
    )
    assert response.status_code == 200 and response.content == b"img"
    assert client.calls == [("media", "hello-world", "m1")]
    assert media.seen is not None
    assert media.seen[0].startswith("https://acct.blob.core.windows.net/")
    assert media.seen[1] == "bytes=0-9"


def test_media_failures_never_reach_the_proxy():
    web, client, media = make()
    client.error = NOT_FOUND
    assert web.get("/blog/posts/hello-world/media/m1").status_code == 404
    assert media.seen is None


def test_audio_uses_the_audio_link():
    web, client, media = make()
    assert web.get("/blog/posts/hello-world/audio").status_code == 200
    assert client.calls == [("audio", "hello-world")]
    assert media.seen is not None
