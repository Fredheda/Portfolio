import json
import logging
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from ag_ui.core import EventType, RunAgentInput, RunErrorEvent, RunStartedEvent
from agent.agent import build_graph
from agent.safe_errors import GENERIC_RUN_ERROR, SafeErrorAgent, describe
from fastapi.testclient import TestClient
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.tools import StructuredTool
from langgraph.graph import MessagesState, StateGraph
from main import create_app

AGENT_PATH = "/agent/portfolio_agent"

PLANTED_OPENAI = (
    "Error code: 401 - Incorrect API key provided (sk-proj-PLANTEDKEY1234). "
    "organization org-PLANTEDORG request req_PLANTEDREQ"
)
PLANTED_FUNC = (
    "Client error '401 Unauthorized' for url "
    "'https://planted-func.azurewebsites.net/runtime/webhooks/mcp' "
    "x-functions-key: PLANTEDFUNCKEY"
)
PLANTED_ALL = (
    "sk-proj-PLANTEDKEY1234",
    "org-PLANTEDORG",
    "req_PLANTEDREQ",
    "planted-func.azurewebsites.net",
    "PLANTEDFUNCKEY",
)


class NeverFlags:
    def __init__(self):
        self.moderations = self

    def create(self, model: str, input: str):
        return SimpleNamespace(results=[SimpleNamespace(flagged=False)])


class FailingModel(BaseChatModel):
    @property
    def _llm_type(self) -> str:
        return "failing"

    def bind_tools(self, tools, **kwargs):  # type: ignore[override]
        return self

    def _generate(self, messages, stop=None, run_manager=None, **kwargs) -> ChatResult:
        raise RuntimeError(PLANTED_OPENAI)


class ToolCallingModel(BaseChatModel):
    @property
    def _llm_type(self) -> str:
        return "tool-calling"

    def bind_tools(self, tools, **kwargs):  # type: ignore[override]
        return self

    def _generate(self, messages, stop=None, run_manager=None, **kwargs) -> ChatResult:
        message = AIMessage(
            "",
            tool_calls=[
                {
                    "id": f"call_{uuid4().hex}",
                    "name": "retrieve_information",
                    "args": {"search_query": "anything"},
                }
            ],
        )
        return ChatResult(generations=[ChatGeneration(message=message)])


def _failing_tool() -> StructuredTool:
    def retrieve_information(search_query: str) -> str:
        raise RuntimeError(PLANTED_FUNC)

    return StructuredTool.from_function(
        func=retrieve_information,
        name="retrieve_information",
        description="Search Frederik's background documents.",
    )


def _run_body() -> dict:
    return {
        "threadId": f"t-{uuid4().hex}",
        "runId": f"r-{uuid4().hex}",
        "state": {},
        "messages": [{"id": "m-1", "role": "user", "content": "hello"}],
        "tools": [],
        "context": [],
        "forwardedProps": {},
    }


def _events(body: str) -> list[dict]:
    return [
        json.loads(line[len("data:") :])
        for line in body.splitlines()
        if line.startswith("data:")
    ]


def _app(model: BaseChatModel, tools: list) -> Any:
    async def build():
        with patch("agent.agent.load_mcp_tools", new=AsyncMock(return_value=tools)):
            return await build_graph(
                model=model,
                moderation_client=NeverFlags(),  # pyright: ignore[reportArgumentType]
            )

    return create_app(build=build)


def _post_run(app) -> str:
    with TestClient(app) as client:
        response = client.post(
            AGENT_PATH, json=_run_body(), headers={"accept": "text/event-stream"}
        )
    assert response.status_code == 200
    return response.text


def _assert_safe_ending(body: str, caplog) -> None:
    events = _events(body)
    types = [e["type"] for e in events]
    assert "RUN_STARTED" in types
    errors = [e for e in events if e["type"] == "RUN_ERROR"]
    assert len(errors) == 1
    assert events[-1]["type"] == "RUN_ERROR"
    assert errors[0]["message"] == GENERIC_RUN_ERROR
    assert "rawEvent" not in errors[0]
    assert "RUN_FINISHED" not in types
    for planted in PLANTED_ALL:
        assert planted not in body
        assert planted not in caplog.text
    assert "RuntimeError" in caplog.text


def test_model_error_ends_the_run_with_a_fixed_run_error(caplog):
    app = _app(FailingModel(), [])
    with caplog.at_level(logging.ERROR):
        body = _post_run(app)
    _assert_safe_ending(body, caplog)


def test_tool_transport_error_ends_the_run_with_a_fixed_run_error(caplog):
    app = _app(ToolCallingModel(), [_failing_tool()])
    with caplog.at_level(logging.ERROR):
        body = _post_run(app)
    _assert_safe_ending(body, caplog)


# The 0.0.47 shape: the library itself yields RUN_ERROR with the provider
# text and raw_event, and never raises after a terminal event.


def _noop_graph():
    graph = StateGraph(MessagesState)
    graph.add_node("noop", lambda state: {})
    graph.set_entry_point("noop")
    graph.set_finish_point("noop")
    return graph.compile()


def _safe_agent() -> SafeErrorAgent:
    return SafeErrorAgent(
        name="portfolio_agent", graph=_noop_graph(), description="test"
    )


def _input() -> RunAgentInput:
    return RunAgentInput(
        thread_id="t-1",
        run_id="r-1",
        state={},
        messages=[],
        tools=[],
        context=[],
        forwarded_props={},
    )


async def _collect(agent: SafeErrorAgent) -> list[Any]:
    return [event async for event in agent.run(_input())]


@pytest.mark.asyncio
async def test_upstream_run_error_is_rewritten(monkeypatch, caplog):
    async def upstream(self, input):
        yield RunStartedEvent(type=EventType.RUN_STARTED, thread_id="t-1", run_id="r-1")
        yield RunErrorEvent(
            type=EventType.RUN_ERROR,
            message=PLANTED_OPENAI,
            code="E1",
            raw_event={"data": PLANTED_OPENAI},
        )

    monkeypatch.setattr("agent.safe_errors.LangGraphAGUIAgent.run", upstream)
    with caplog.at_level(logging.ERROR):
        events = await _collect(_safe_agent())
    assert [e.type for e in events] == [EventType.RUN_STARTED, EventType.RUN_ERROR]
    error = events[-1]
    assert error.message == GENERIC_RUN_ERROR
    assert error.code is None
    assert error.raw_event is None
    for planted in ("sk-proj-PLANTEDKEY1234", "org-PLANTEDORG", "req_PLANTEDREQ"):
        assert planted not in caplog.text


@pytest.mark.asyncio
async def test_exception_before_run_started_yields_both_events(monkeypatch, caplog):
    async def upstream(self, input):
        raise RuntimeError(PLANTED_OPENAI)
        yield  # pragma: no cover  (makes this an async generator)

    monkeypatch.setattr("agent.safe_errors.LangGraphAGUIAgent.run", upstream)
    with caplog.at_level(logging.ERROR):
        events = await _collect(_safe_agent())
    assert [e.type for e in events] == [EventType.RUN_STARTED, EventType.RUN_ERROR]
    assert events[0].thread_id == "t-1" and events[0].run_id == "r-1"
    assert events[-1].message == GENERIC_RUN_ERROR


@pytest.mark.asyncio
async def test_no_second_terminal_event_when_upstream_raises_after_run_error(
    monkeypatch, caplog
):
    async def upstream(self, input):
        yield RunStartedEvent(type=EventType.RUN_STARTED, thread_id="t-1", run_id="r-1")
        yield RunErrorEvent(type=EventType.RUN_ERROR, message=PLANTED_OPENAI)
        raise RuntimeError(PLANTED_FUNC)

    monkeypatch.setattr("agent.safe_errors.LangGraphAGUIAgent.run", upstream)
    with caplog.at_level(logging.ERROR):
        events = await _collect(_safe_agent())
    assert [e.type for e in events] == [EventType.RUN_STARTED, EventType.RUN_ERROR]
    assert "planted-func.azurewebsites.net" not in caplog.text


class RateLimited(Exception):
    status_code = 429


def test_describe_gives_the_type_and_never_the_message():
    assert describe(RuntimeError(PLANTED_OPENAI)) == "RuntimeError"


def test_describe_adds_the_status_of_a_provider_error():
    assert describe(RateLimited(PLANTED_OPENAI)) == "RateLimited status=429"


def test_describe_reads_the_status_of_an_http_response():
    error = RuntimeError(PLANTED_FUNC)
    error.response = SimpleNamespace(status_code=401)  # type: ignore[attr-defined]
    assert describe(error) == "RuntimeError status=401"


def test_describe_flattens_exception_groups():
    group = ExceptionGroup("transport", [RuntimeError(PLANTED_FUNC), RateLimited("x")])
    assert describe(group) == "ExceptionGroup(2): RuntimeError; RateLimited status=429"
