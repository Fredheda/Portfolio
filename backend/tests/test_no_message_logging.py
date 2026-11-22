import importlib.util
import logging
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from agent.agent import build_graph
from agent.content_safety_middleware import REFUSAL_MESSAGE
from fastapi.testclient import TestClient
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from main import create_app

AGENT_PATH = "/agent/portfolio_agent"
PLANTED_USER = "PLANTED-USER-TEXT-7f3a"
PLANTED_REPLY = "PLANTED-REPLY-TEXT-9c1d"


class Moderation:
    def __init__(self, flagged: bool):
        self.moderations = self
        self._flagged = flagged

    def create(self, model: str, input: str):
        return SimpleNamespace(results=[SimpleNamespace(flagged=self._flagged)])


class FixedReply(BaseChatModel):
    @property
    def _llm_type(self) -> str:
        return "fixed-reply"

    def bind_tools(self, tools, **kwargs):  # type: ignore[override]
        return self

    def _generate(self, messages, stop=None, run_manager=None, **kwargs) -> ChatResult:
        return ChatResult(
            generations=[ChatGeneration(message=AIMessage(content=PLANTED_REPLY))]
        )


class QuotingFailure(FixedReply):
    def _generate(self, messages, stop=None, run_manager=None, **kwargs) -> ChatResult:
        raise RuntimeError(f"400 bad request, input was: {PLANTED_USER}")


def _importable(module: str) -> bool:
    try:
        return importlib.util.find_spec(module) is not None
    except ModuleNotFoundError:
        return False


def _leaked_text(model: BaseChatModel, flagged: bool, capfd, caplog) -> tuple[str, str]:
    async def build():
        with patch("agent.agent.load_mcp_tools", new=AsyncMock(return_value=[])):
            return await build_graph(
                model=model,
                moderation_client=Moderation(flagged),  # pyright: ignore[reportArgumentType]
            )

    body = {
        "threadId": f"t-{uuid4().hex}",
        "runId": f"r-{uuid4().hex}",
        "state": {},
        "messages": [{"id": "m-1", "role": "user", "content": PLANTED_USER}],
        "tools": [],
        "context": [],
        "forwardedProps": {},
    }
    with caplog.at_level(logging.DEBUG), TestClient(create_app(build=build)) as client:
        response = client.post(
            AGENT_PATH, json=body, headers={"accept": "text/event-stream"}
        )
    assert response.status_code == 200
    captured = capfd.readouterr()
    return response.text, caplog.text + captured.out + captured.err


def test_no_message_text_reaches_a_log_or_the_output(capfd, caplog):
    stream, leaked = _leaked_text(FixedReply(), False, capfd, caplog)
    assert PLANTED_REPLY in stream
    assert PLANTED_USER not in leaked
    assert PLANTED_REPLY not in leaked


def test_a_flagged_message_reaches_no_log(capfd, caplog):
    stream, leaked = _leaked_text(FixedReply(), True, capfd, caplog)
    assert REFUSAL_MESSAGE in stream
    assert PLANTED_USER not in leaked


def test_a_provider_error_quoting_the_message_reaches_no_log(capfd, caplog):
    _, leaked = _leaked_text(QuotingFailure(), False, capfd, caplog)
    assert PLANTED_USER not in leaked
    assert "RuntimeError" in leaked


def test_the_sql_logging_modules_are_gone():
    assert not _importable("services.database_client")
    assert not _importable("mssql_python")
