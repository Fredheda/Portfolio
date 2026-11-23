import logging
import os

from langchain_mcp_adapters.client import MultiServerMCPClient

logger = logging.getLogger(__name__)


def build_mcp_client() -> MultiServerMCPClient:
    function_app_url = os.environ["FUNCTION_APP_URL"].rstrip("/")
    mcp_key = os.getenv("FUNCTION_MCP_KEY", "")
    headers = {"x-functions-key": mcp_key} if mcp_key else {}
    return MultiServerMCPClient(
        {
            "portfolio_tools": {
                "transport": "streamable_http",
                "url": f"{function_app_url}/runtime/webhooks/mcp",
                "headers": headers,
            }
        }
    )


async def load_mcp_tools() -> list:
    # An unreachable Function App must not crash-loop the container: start without the MCP tools until the next restart.
    client = build_mcp_client()
    try:
        return await client.get_tools()
    except Exception:
        logger.warning(
            "Could not load MCP tools from the Function App; "
            "starting without MCP tools.",
            exc_info=True,
        )
        return []
