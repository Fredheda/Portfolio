import logging
import os
import re
from collections.abc import Mapping
from dataclasses import dataclass

import httpx

from blog.client import BlogClient, HttpBlogClient
from blog.media import MediaProxy, MediaStreamer
from blog.token import ManagedIdentityTokenProvider

logger = logging.getLogger("blog.config")

# api://<application id>: the audience of the blog API's app registration.
AUDIENCE = re.compile(r"api://[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}\Z")
DEFAULT_MEDIA_HOSTS = "fhstorageportfolio.blob.core.windows.net"


@dataclass
class BlogParts:
    client: BlogClient
    media: MediaStreamer
    http: httpx.AsyncClient


def blog_from_env(env: Mapping[str, str] | None = None) -> BlogParts | None:
    """The blog client, or None when the blog is off. Off is the default: with
    no BLOG_API_URL there are no blog routes. A half-configured blog also
    stays off, with one error line (no values), because fredbot shares this
    process and must not be taken down by a blog setting."""
    env = os.environ if env is None else env
    url = env.get("BLOG_API_URL", "").strip()
    if not url:
        return None
    audience = env.get("BLOG_API_AUDIENCE", "").strip()
    client_id = env.get("BLOG_READ_CLIENT_ID", "").strip()
    try:
        parsed = httpx.URL(url) if url.startswith("https://") else None
    except httpx.InvalidURL:
        parsed = None
    if (
        parsed is None
        or parsed.userinfo
        or not AUDIENCE.match(audience)
        or not client_id
    ):
        logger.error(
            "blog disabled: BLOG_API_URL must be https without credentials, "
            "BLOG_API_AUDIENCE must be api://<guid>, BLOG_READ_CLIENT_ID must be set"
        )
        return None
    hosts = [
        host.strip()
        for host in env.get("BLOG_MEDIA_HOSTS", DEFAULT_MEDIA_HOSTS).split(",")
        if host.strip()
    ]
    # Never follow a redirect: not for the API, not for blob URLs.
    http = httpx.AsyncClient(follow_redirects=False)
    tokens = ManagedIdentityTokenProvider(client_id, audience)
    return BlogParts(
        client=HttpBlogClient(url, tokens, http),
        media=MediaProxy(http, hosts),
        http=http,
    )
