import os
from collections.abc import Mapping
from typing import Protocol

from services.database_client import database_client

# Opt-in for a local run that should write chat logs to Azure SQL (needs
# `az login` and the AZURE_SQL_* names).
OPT_IN = "CHAT_LOG_TO_SQL"


class ChatLogger(Protocol):
    def log_chatbot_interaction(
        self, message: str, message_type: str, duration: int
    ) -> None: ...


class NoopChatLogger:
    def log_chatbot_interaction(
        self, message: str, message_type: str, duration: int
    ) -> None:
        return None


def chat_logger_from_env(env: Mapping[str, str] | None = None) -> ChatLogger:
    """Azure SQL logging runs only inside a Container App (the platform sets
    CONTAINER_APP_NAME) or when CHAT_LOG_TO_SQL=1 is set. Anywhere else, such
    as a local start whose .env holds the AZURE_SQL_* names for infra/deploy.sh,
    nothing is logged. One line at startup says which case applies."""
    env = os.environ if env is None else env
    in_azure = bool(env.get("CONTAINER_APP_NAME"))
    if not (in_azure or env.get(OPT_IN) == "1"):
        print(
            f"Chat logging to Azure SQL is off: not running in Azure and {OPT_IN}=1 is not set.",
            flush=True,
        )
        return NoopChatLogger()
    if not (env.get("AZURE_SQL_SERVER") and env.get("AZURE_SQL_DATABASE")):
        print(
            "Chat logging to Azure SQL is off: AZURE_SQL_SERVER or AZURE_SQL_DATABASE is not set.",
            flush=True,
        )
        return NoopChatLogger()
    print("Chat logging to Azure SQL is on.", flush=True)
    return database_client()
