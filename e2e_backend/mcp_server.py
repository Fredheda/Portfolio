"""Serves the real mcp-tools handlers over MCP streamable HTTP.

mcp-tools/function_app.py is imported as is. Before that, a small shim
stands in for `azure.functions` (recording each `mcp_tool_trigger`), a stub
replaces `search_client` (Azure AI Search), and the content loader is
pointed at the repo's content file. Tool names, descriptions, parameters and
handlers therefore come from production code. Like the Function App, the
endpoint is /runtime/webhooks/mcp and needs the x-functions-key header.

Run from backend/: PYTHONPATH=.. poetry run python -m e2e_backend.mcp_server
"""

import json
import os
import sys
import types
from contextlib import asynccontextmanager
from pathlib import Path

import mcp.types as mcp_types
import uvicorn
from mcp.server.lowlevel import Server
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager
from starlette.applications import Starlette
from starlette.responses import PlainTextResponse
from starlette.routing import Route

REPO = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("E2E_MCP_PORT", "8211"))
MCP_KEY = os.environ.get("E2E_MCP_KEY", "e2e-test-key")

# tool name -> (description, tool_properties, handler)
TOOLS: dict[str, tuple[str, list[dict], types.FunctionType]] = {}


class _FunctionApp:
    def mcp_tool_trigger(self, *, arg_name, tool_name, description, tool_properties):
        def register(fn):
            TOOLS[tool_name] = (description, json.loads(tool_properties), fn)
            return fn

        return register


class _AzureFunctionsShim(types.ModuleType):
    def __getattr__(self, name):
        raise AttributeError(
            f"azure.functions shim has no {name!r}; function_app.py uses more "
            "of the SDK than e2e_backend/mcp_server.py covers"
        )


def _install_shims() -> None:
    shim = _AzureFunctionsShim("azure.functions")
    shim.FunctionApp = _FunctionApp  # type: ignore[attr-defined]
    sys.modules["azure.functions"] = shim

    search = types.ModuleType("search_client")
    search.retrieve_information = lambda q: f"Stub search result for: {q}"  # type: ignore[attr-defined]
    sys.modules["search_client"] = search

    sys.path.insert(0, str(REPO / "mcp-tools"))
    import content_loader

    content_loader.CONTENT_PATH = REPO / "content" / "site-content.json"
    import function_app  # noqa: F401  (registers the tools)


def _input_schema(properties: list[dict]) -> dict:
    return {
        "type": "object",
        "properties": {
            p["propertyName"]: {
                "type": p["propertyType"],
                "description": p["description"],
            }
            for p in properties
        },
        "required": [p["propertyName"] for p in properties if p.get("isRequired")],
    }


def build_app() -> Starlette:
    _install_shims()
    server = Server("portfolio-tools-e2e")

    @server.list_tools()
    async def list_tools() -> list[mcp_types.Tool]:
        return [
            mcp_types.Tool(
                name=name, description=desc, inputSchema=_input_schema(props)
            )
            for name, (desc, props, _) in TOOLS.items()
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[mcp_types.TextContent]:
        handler = TOOLS[name][2]
        text = handler(json.dumps({"arguments": arguments}))
        return [mcp_types.TextContent(type="text", text=text)]

    sessions = StreamableHTTPSessionManager(app=server, stateless=True)

    class McpEndpoint:
        async def __call__(self, scope, receive, send):
            headers = dict(scope["headers"])
            if headers.get(b"x-functions-key") != MCP_KEY.encode():
                response = PlainTextResponse("missing or wrong x-functions-key", 401)
                await response(scope, receive, send)
                return
            await sessions.handle_request(scope, receive, send)

    @asynccontextmanager
    async def lifespan(app):
        async with sessions.run():
            yield

    return Starlette(
        routes=[
            Route("/health", lambda request: PlainTextResponse("ok")),
            Route(
                "/runtime/webhooks/mcp",
                McpEndpoint(),
                methods=["GET", "POST", "DELETE"],
            ),
        ],
        lifespan=lifespan,
    )


if __name__ == "__main__":
    uvicorn.run(build_app(), host="127.0.0.1", port=PORT)
