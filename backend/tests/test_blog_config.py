import logging

import httpx
import pytest
from blog.client import HttpBlogClient
from blog.config import BlogParts, blog_from_env
from blog.media import MediaProxy
from fastapi.testclient import TestClient
from main import create_app

from tests.blog_fixtures import FakeClient, FakeMedia

AUDIENCE = "api://11111111-2222-3333-4444-555555555555"
GOOD = {
    "BLOG_API_URL": "https://ca-blogapi.example.azurecontainerapps.io",
    "BLOG_API_AUDIENCE": AUDIENCE,
    "BLOG_READ_CLIENT_ID": "99999999-8888-7777-6666-555555555555",
}


def test_unset_means_off_and_says_nothing(caplog):
    with caplog.at_level(logging.DEBUG):
        assert blog_from_env({}) is None
    assert caplog.text == ""


@pytest.mark.parametrize(
    "change",
    [
        {"BLOG_API_AUDIENCE": ""},
        {"BLOG_API_AUDIENCE": "https://not-an-api-uri"},
        {"BLOG_API_AUDIENCE": "api://name-not-a-guid"},
        {"BLOG_READ_CLIENT_ID": ""},
        {"BLOG_API_URL": "http://insecure.example"},
        {"BLOG_API_URL": "https://user:pw@host.example"},
    ],
)
def test_a_half_configured_blog_stays_off_and_logs_one_error(change, caplog):
    with caplog.at_level(logging.ERROR):
        assert blog_from_env({**GOOD, **change}) is None
    assert len(caplog.records) == 1
    assert "pw@" not in caplog.text


def test_a_valid_config_builds_the_client_and_a_media_proxy():
    parts = blog_from_env(GOOD)
    assert parts is not None
    assert isinstance(parts.client, HttpBlogClient)
    assert isinstance(parts.media, MediaProxy)
    assert parts.media._hosts == {"fhstorageportfolio.blob.core.windows.net"}
    assert parts.http.follow_redirects is False


def test_media_hosts_come_from_the_environment():
    parts = blog_from_env(
        {**GOOD, "BLOG_MEDIA_HOSTS": "a.blob.core.windows.net, b.blob.core.windows.net"}
    )
    assert parts is not None
    assert isinstance(parts.media, MediaProxy)
    assert parts.media._hosts == {"a.blob.core.windows.net", "b.blob.core.windows.net"}


def test_the_app_has_blog_routes_only_when_the_blog_is_configured():
    async def build():
        return object()

    off = TestClient(create_app(build=build, blog=lambda: None))
    assert off.get("/blog/posts").status_code == 404
    parts = BlogParts(client=FakeClient(), media=FakeMedia(), http=httpx.AsyncClient())
    on = TestClient(create_app(build=build, blog=lambda: parts))
    assert on.get("/blog/posts").status_code == 200
    assert on.get("/health").status_code == 200
