import pytest
from blog.models import MEDIA_ID, SLUG, AudioLink, MediaLink, Post, PostList
from pydantic import ValidationError

from tests.blog_fixtures import AUDIO_LINK, MEDIA_LINK, POST, POST_LIST


def test_v1_examples_parse_and_drop_what_must_not_reach_a_browser():
    posts = PostList.model_validate(POST_LIST)
    post = Post.model_validate(POST)
    assert posts.items[0].slug == "hello-world"
    assert post.media[0].id == "m1"
    assert MediaLink.model_validate(MEDIA_LINK).bytes == 64
    assert AudioLink.model_validate(AUDIO_LINK).durationSec == 61.5
    dumped = post.model_dump_json()
    assert "blobPath" not in dumped  # a storage path never leaves the backend
    assert "futureField" not in dumped  # unknown fields are ignored, not echoed


def test_a_response_missing_a_field_the_pages_need_is_rejected():
    broken = {k: v for k, v in POST.items() if k != "title"}
    with pytest.raises(ValidationError):
        Post.model_validate(broken)


@pytest.mark.parametrize("value", ["hello-world", "a", "post-2", "0-first"])
def test_slugs_the_blog_issues_match(value):
    assert SLUG.match(value)


@pytest.mark.parametrize(
    "value", ["", "../secrets", "A", "a/b", "a b", "-lead", "a" * 101, "a\nb"]
)
def test_slugs_that_could_change_the_request_path_do_not_match(value):
    assert not SLUG.match(value)


@pytest.mark.parametrize("value", ["", "..", "a/b", "a b", "a" * 65, "a\nb"])
def test_media_ids_that_could_change_the_request_path_do_not_match(value):
    assert not MEDIA_ID.match(value)
