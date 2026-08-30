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
