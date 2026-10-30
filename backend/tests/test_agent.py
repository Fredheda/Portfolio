from unittest.mock import AsyncMock, patch

import pytest
from agent.agent import SYSTEM_PROMPT, build_graph


def test_system_prompt_loads_and_documents_frontend_tools():
    assert SYSTEM_PROMPT.strip()
    assert "highlightProjects" in SYSTEM_PROMPT
    assert "renderProjectCard" in SYSTEM_PROMPT


@pytest.mark.asyncio
async def test_build_graph_compiles_and_is_invocable():
    with patch("agent.agent.load_mcp_tools", new=AsyncMock(return_value=[])):
        graph = await build_graph()
    assert graph is not None
    assert hasattr(graph, "invoke")
    assert hasattr(graph, "ainvoke")


@pytest.mark.asyncio
async def test_build_graph_defaults_to_the_production_model():
    with (
        patch("agent.agent.load_mcp_tools", new=AsyncMock(return_value=[])),
        patch("agent.agent.create_agent") as create_agent,
    ):
        await build_graph()
    model = create_agent.call_args.kwargs["model"]
    assert model.model_name == "gpt-5.6-luna"
    assert model.reasoning_effort == "none"


@pytest.mark.asyncio
async def test_build_graph_uses_an_injected_model():
    sentinel = object()
    with (
        patch("agent.agent.load_mcp_tools", new=AsyncMock(return_value=[])),
        patch("agent.agent.create_agent") as create_agent,
    ):
        await build_graph(model=sentinel)  # pyright: ignore[reportArgumentType]
    assert create_agent.call_args.kwargs["model"] is sentinel
