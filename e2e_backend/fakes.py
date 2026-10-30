"""Stand-ins for the OpenAI moderation client and the Azure SQL logger.

Neither defines __len__ or __bool__: the middlewares use `client or default`,
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


class RecordingDatabase:
    def __init__(self):
        self.rows: list[list] = []

    def log_chatbot_interaction(self, message: str, message_type: str, duration: int):
        self.rows.append([message, message_type, duration])
