import os

PORT = int(os.environ.get("E2E_BACKEND_PORT", "8210"))
MCP_PORT = os.environ.get("E2E_MCP_PORT", "8211")

# Set before importing the backend: load_dotenv() never overrides existing variables, so no local .env leaks in.
os.environ["OPENAI_API_KEY"] = "sk-e2e-dummy-key-not-used"
os.environ["FUNCTION_APP_URL"] = f"http://127.0.0.1:{MCP_PORT}"
os.environ["FUNCTION_MCP_KEY"] = os.environ.get("E2E_MCP_KEY", "e2e-test-key")

import httpx  # noqa: E402
import uvicorn  # noqa: E402
from agent.agent import build_graph  # noqa: E402
from blog.client import HttpBlogClient  # noqa: E402
from blog.config import BlogParts  # noqa: E402
from blog.media import MediaProxy  # noqa: E402
from blog.token import StaticTokenProvider  # noqa: E402
from main import create_app  # noqa: E402

from e2e_backend import blog_api  # noqa: E402
from e2e_backend.fakes import FlaggingModeration  # noqa: E402
from e2e_backend.model import ScriptedChatModel  # noqa: E402

MODEL = ScriptedChatModel()

BLOG_HTTP = httpx.AsyncClient(follow_redirects=False)
BLOG = BlogParts(
    client=HttpBlogClient(
        f"http://127.0.0.1:{MCP_PORT}/blog-api",
        StaticTokenProvider(blog_api.TOKEN),
        BLOG_HTTP,
        retry_delay=0.05,
    ),
    media=MediaProxy(BLOG_HTTP, {"127.0.0.1"}, allow_insecure=True),
    http=BLOG_HTTP,
)

app = create_app(
    build=lambda: build_graph(
        model=MODEL,
        moderation_client=FlaggingModeration(),  # pyright: ignore[reportArgumentType]
    ),
    blog=lambda: BLOG,
)


@app.get("/__model_calls")
def model_calls() -> list[dict]:
    return MODEL.calls


@app.post("/__reset")
def reset() -> dict:
    MODEL.calls.clear()
    MODEL.fail_next = False
    return {"ok": True}


@app.post("/__fail")
def fail_next() -> dict:
    MODEL.fail_next = True
    return {"ok": True}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=PORT)
