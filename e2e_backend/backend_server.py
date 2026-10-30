"""The real backend app with a scripted model and fake moderation and logging.

Uses main.create_app and agent.build_graph, so the agent path, the agent
name, the middleware order and the MCP client are production code. Adds
test-only routes the Playwright specs read and drive.

Run from backend/: PYTHONPATH=.. poetry run python -m e2e_backend.backend_server
"""

import os

PORT = int(os.environ.get("E2E_BACKEND_PORT", "8210"))
MCP_PORT = os.environ.get("E2E_MCP_PORT", "8211")

# Set before importing the backend: main.py's load_dotenv() never overrides
# variables that already exist, so a local .env cannot leak in.
os.environ["OPENAI_API_KEY"] = "sk-e2e-dummy-key-not-used"
os.environ["FUNCTION_APP_URL"] = f"http://127.0.0.1:{MCP_PORT}"
os.environ["FUNCTION_MCP_KEY"] = os.environ.get("E2E_MCP_KEY", "e2e-test-key")

import uvicorn  # noqa: E402
from agent.agent import build_graph  # noqa: E402
from main import create_app  # noqa: E402

from e2e_backend.fakes import FlaggingModeration, RecordingDatabase  # noqa: E402
from e2e_backend.model import ScriptedChatModel  # noqa: E402

MODEL = ScriptedChatModel()
DB = RecordingDatabase()

app = create_app(
    build=lambda: build_graph(
        model=MODEL,
        moderation_client=FlaggingModeration(),  # pyright: ignore[reportArgumentType]
        db=DB,  # pyright: ignore[reportArgumentType]
    )
)


@app.get("/__model_calls")
def model_calls() -> list[dict]:
    return MODEL.calls


@app.get("/__db_log")
def db_log() -> list[list]:
    return DB.rows


@app.post("/__reset")
def reset() -> dict:
    MODEL.calls.clear()
    MODEL.fail_next = False
    DB.rows.clear()
    return {"ok": True}


@app.post("/__fail")
def fail_next() -> dict:
    MODEL.fail_next = True
    return {"ok": True}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=PORT)
