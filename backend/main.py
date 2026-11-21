import os
from collections.abc import Awaitable, Callable, Mapping
from contextlib import asynccontextmanager
from typing import Any

from ag_ui_langgraph import add_langgraph_fastapi_endpoint
from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

from agent.agent import build_graph  # noqa: E402 — must follow load_dotenv()
from agent.safe_errors import SafeErrorAgent  # noqa: E402
from blog.config import BlogParts, blog_from_env  # noqa: E402
from blog.routes import build_blog_router  # noqa: E402

if not os.getenv("OPENAI_API_KEY"):
    raise RuntimeError("OPENAI_API_KEY is not set.")
if not os.getenv("FUNCTION_APP_URL"):
    raise RuntimeError("FUNCTION_APP_URL is not set (the MCP tools Function App URL).")


def create_app(
    build: Callable[[], Awaitable[Any]] = build_graph,
    blog: Callable[[], BlogParts | None] = blog_from_env,
) -> FastAPI:
    # `build` and `blog` exist for the browser tests, which pass a graph with
    # a scripted model and a blog client with a fake read API; production uses
    # build_graph() and the environment.
    blog_parts = blog()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # build_graph() is async, so it has to run inside the ASGI server's own
        # event loop (FastAPI startup) rather than via asyncio.run() at import
        # time — asyncio.run() can't nest inside the loop uvicorn is already
        # running when it imports this module to resolve "main:app".
        graph = await build()
        add_langgraph_fastapi_endpoint(
            app=app,
            agent=SafeErrorAgent(
                name="portfolio_agent",
                description="Frederik Heda's portfolio assistant.",
                graph=graph,
            ),
            path="/agent/portfolio_agent",
        )
        yield
        if blog_parts is not None:
            await blog_parts.http.aclose()

    app = FastAPI(lifespan=lifespan)
    if blog_parts is not None:
        app.include_router(build_blog_router(blog_parts.client, blog_parts.media))

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()


def listen_address(env: Mapping[str, str]) -> tuple[str, int]:
    """Where `python main.py` listens: loopback unless HOST says otherwise.
    The image does not use this: its CMD starts uvicorn on 0.0.0.0 itself."""
    return env.get("HOST") or "127.0.0.1", int(env.get("PORT") or 8000)


if __name__ == "__main__":
    import uvicorn

    host, port = listen_address(os.environ)
    uvicorn.run(app, host=host, port=port)
