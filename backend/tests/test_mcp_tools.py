import logging

import pytest
from agent.mcp_tools import load_mcp_tools


@pytest.mark.asyncio
async def test_unreachable_mcp_server_gives_no_tools_instead_of_failing(
    monkeypatch, caplog
):
    monkeypatch.setenv("FUNCTION_APP_URL", "http://127.0.0.1:9")
    with caplog.at_level(logging.WARNING, logger="agent.mcp_tools"):
        tools = await load_mcp_tools()
    assert tools == []
    assert "starting without MCP tools" in caplog.text
