"""Stand-in for the OpenAI moderation client.

It defines neither __len__ nor __bool__: the middleware uses `client or default`,
so a falsy fake would be silently replaced by the real client.
"""

from types import SimpleNamespace

FLAGGED_KEYWORD = "forbidden-topic"


class FlaggingModeration:
    def __init__(self):
        self.moderations = self

    def create(self, model: str, input: str):
        return SimpleNamespace(
            results=[SimpleNamespace(flagged=FLAGGED_KEYWORD in input)]
        )
