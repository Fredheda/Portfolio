import os
from contextlib import asynccontextmanager

from ag_ui_langgraph import add_langgraph_fastapi_endpoint
from copilotkit import LangGraphAGUIAgent
from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

from agent.agent import build_graph  # noqa: E402 — must follow load_dotenv()

if not os.getenv("OPENAI_API_KEY"):
    raise RuntimeError("OPENAI_API_KEY is not set.")
if not os.getenv("FUNCTION_APP_URL"):
    raise RuntimeError("FUNCTION_APP_URL is not set (the MCP tools Function App URL).")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # build_graph() is async, so it has to run inside the ASGI server's own
    # event loop (FastAPI startup) rather than via asyncio.run() at import
    # time — asyncio.run() can't nest inside the loop uvicorn is already
    # running when it imports this module to resolve "main:app".
    graph = await build_graph()
    add_langgraph_fastapi_endpoint(
        app=app,
        agent=LangGraphAGUIAgent(
            name="portfolio_agent",
            description="Frederik Heda's portfolio assistant.",
            graph=graph,
        ),
        path="/agent/portfolio_agent",
    )
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
