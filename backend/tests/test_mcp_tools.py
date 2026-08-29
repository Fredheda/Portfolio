import pytest

from agent.mcp_tools import build_mcp_client, load_mcp_tools


def test_build_mcp_client_uses_function_app_url(monkeypatch):
    monkeypatch.setenv("FUNCTION_APP_URL", "https://example-func.azurewebsites.net")
    monkeypatch.setenv("FUNCTION_MCP_KEY", "test-key")
    client = build_mcp_client()
    connections = client.connections
    assert "portfolio_tools" in connections
    assert connections["portfolio_tools"]["url"] == "https://example-func.azurewebsites.net/runtime/webhooks/mcp"
    assert connections["portfolio_tools"]["headers"] == {"x-functions-key": "test-key"}


@pytest.mark.asyncio
async def test_load_mcp_tools_returns_client_tools(monkeypatch):
    class FakeClient:
        async def get_tools(self):
            return ["tool-a", "tool-b"]

    monkeypatch.setattr("agent.mcp_tools.build_mcp_client", lambda: FakeClient())
    tools = await load_mcp_tools()
    assert tools == ["tool-a", "tool-b"]
