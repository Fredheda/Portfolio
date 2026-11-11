from blog.cache import ResponseCache


class Clock:
    def __init__(self):
        self.now = 0.0

    def __call__(self):
        return self.now


def test_entries_are_fresh_then_stale_then_gone():
    clock = Clock()
    cache = ResponseCache(ttl=60, stale_ttl=900, clock=clock)
    cache.put("k", "v", '"e"')
    entry, fresh = cache.get("k")
    assert entry is not None and entry.value == "v" and entry.etag == '"e"' and fresh
    clock.now = 61
    entry, fresh = cache.get("k")
    assert entry is not None and not fresh  # still usable for revalidation and outages
    clock.now = 901
    assert cache.get("k") == (None, False)


def test_touch_makes_a_revalidated_entry_fresh_again():
    clock = Clock()
    cache = ResponseCache(ttl=60, clock=clock)
    cache.put("k", "v", None)
    clock.now = 61
    cache.touch("k")
    assert cache.get("k")[1] is True


def test_the_oldest_entry_is_evicted_at_the_size_limit():
    cache = ResponseCache(max_entries=2, clock=Clock())
    cache.put("a", 1, None)
    cache.put("b", 2, None)
    cache.put("c", 3, None)
    assert cache.get("a") == (None, False)
    assert cache.get("b")[0] is not None and cache.get("c")[0] is not None
