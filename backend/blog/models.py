
import re

from pydantic import BaseModel, ConfigDict

# \Z, not $: "$" also matches before a trailing newline.
SLUG = re.compile(r"[a-z0-9][a-z0-9-]{0,99}\Z")
MEDIA_ID = re.compile(r"[A-Za-z0-9_-]{1,64}\Z")


class _V1(BaseModel):
    model_config = ConfigDict(extra="ignore")


class PostSummary(_V1):
    postId: str
    slug: str
    title: str
    summary: str
    tags: list[str] = []
    publishedAt: str
    updatedAt: str
    readingTimeMinutes: int
    coverMediaId: str | None = None
    hasAudio: bool = False


class MediaDescriptor(_V1):
    id: str
    kind: str
    mime: str
    bytes: int
    width: int | None = None
    height: int | None = None
    durationSec: float | None = None
    alt: str | None = None


class AudioDescriptor(_V1):
    durationSec: float
    bytes: int


class Post(PostSummary):
    body: str
    version: int
    media: list[MediaDescriptor] = []
    audio: AudioDescriptor | None = None


class PostList(_V1):
    items: list[PostSummary]
    nextCursor: str | None = None


class MediaLink(_V1):
    url: str
    expiresAt: str
    contentType: str
    bytes: int


class AudioLink(MediaLink):
    durationSec: float
