"""No __len__ or __bool__: the middleware does `client or default`, so a falsy fake would be replaced by the real client."""

from types import SimpleNamespace

FLAGGED_KEYWORD = "forbidden-topic"


class FlaggingModeration:
    def __init__(self):
        self.moderations = self

    def create(self, model: str, input: str):
        return SimpleNamespace(
            results=[SimpleNamespace(flagged=FLAGGED_KEYWORD in input)]
        )
