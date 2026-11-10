import time
from collections import OrderedDict
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any


@dataclass
class Entry:
    value: Any
    etag: str | None
    stored_at: float


class ResponseCache:
    """In-memory, per process. A fresh entry is served as is; an older one is
    kept for revalidation (If-None-Match) and as the answer when the API is
    down, until `stale_ttl` has passed. Bounded, oldest entry out first."""

    def __init__(
        self,
        ttl: float = 60.0,
        stale_ttl: float = 900.0,
        max_entries: int = 256,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._ttl = ttl
        self._stale_ttl = stale_ttl
        self._max = max_entries
        self._clock = clock
        self._entries: OrderedDict[str, Entry] = OrderedDict()

    def get(self, key: str) -> tuple[Entry | None, bool]:
        entry = self._entries.get(key)
        if entry is None:
            return None, False
        age = self._clock() - entry.stored_at
        if age > self._stale_ttl:
            del self._entries[key]
            return None, False
        return entry, age <= self._ttl

    def put(self, key: str, value: Any, etag: str | None) -> None:
        self._entries[key] = Entry(value, etag, self._clock())
        self._entries.move_to_end(key)
        while len(self._entries) > self._max:
            self._entries.popitem(last=False)

    def touch(self, key: str) -> None:
        entry = self._entries.get(key)
        if entry is not None:
            entry.stored_at = self._clock()
