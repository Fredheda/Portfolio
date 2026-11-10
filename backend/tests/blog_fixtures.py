"""Read API v1 payloads transcribed from docs/shared/specs/2026-11-08-blog-studio.md
section 5, plus fakes for the route tests. Replace the payloads by examples
generated from openapi/v1.json once the blog project commits that file."""

from blog.errors import BlogNotFound, BlogUnavailable
from blog.models import AudioLink, MediaLink, Post, PostList
from starlette.responses import Response

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

POST_LIST = {"items": [SUMMARY], "nextCursor": None}

POST = {
    **SUMMARY,
    "body": "# Hello\n\nEuler: $e^{i\\pi}+1=0$\n",
    "version": 1,
    "media": [
        {
            "id": "m1",
            "kind": "image",
            "mime": "image/png",
            "bytes": 64,
            "width": 1,
            "height": 1,
            "alt": "A pixel",
            "blobPath": "blog-published/posts/x/v1/media/m1.png",
        }
    ],
    "audio": None,
}

MEDIA_LINK = {
    "url": "https://acct.blob.core.windows.net/blog-published/posts/x/v1/media/m1.png?sig=SECRET",
    "expiresAt": "2026-11-10T08:10:00Z",
    "contentType": "image/png",
    "bytes": 64,
}

AUDIO_LINK = {**MEDIA_LINK, "contentType": "audio/mpeg", "durationSec": 61.5}


class FakeClient:
    """Stands in for HttpBlogClient in the route tests."""

    def __init__(self) -> None:
        self.error: Exception | None = None
        self.calls: list[tuple] = []

    def _maybe_fail(self) -> None:
        if self.error is not None:
            raise self.error

    async def list_posts(self, limit, cursor, tag) -> PostList:
        self.calls.append(("list", limit, cursor, tag))
        self._maybe_fail()
        return PostList.model_validate(POST_LIST)

    async def get_post(self, slug) -> Post:
        self.calls.append(("post", slug))
        self._maybe_fail()
        return Post.model_validate(POST)

    async def media_link(self, slug, media_id) -> MediaLink:
        self.calls.append(("media", slug, media_id))
        self._maybe_fail()
        return MediaLink.model_validate(MEDIA_LINK)

    async def audio_link(self, slug) -> AudioLink:
        self.calls.append(("audio", slug))
        self._maybe_fail()
        return AudioLink.model_validate(AUDIO_LINK)


class FakeMedia:
    def __init__(self) -> None:
        self.seen: tuple | None = None

    async def stream(self, url, range_header) -> Response:
        self.seen = (url, range_header)
        return Response(b"img", media_type="image/png")


NOT_FOUND = BlogNotFound()
UNAVAILABLE = BlogUnavailable()
