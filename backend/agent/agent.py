from pathlib import Path

from copilotkit import CopilotKitMiddleware
from langchain.agents import create_agent
from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from openai import OpenAI

from agent.content_safety_middleware import ContentSafetyMiddleware
from agent.mcp_tools import load_mcp_tools

SYSTEM_PROMPT = (Path(__file__).parent / "system_prompt.md").read_text()

# gpt-5.6-luna 400s on any non-default temperature and on tool calls unless
# reasoning_effort="none", which the "openai:" shorthand cannot set.
_MODEL = ChatOpenAI(model="gpt-5.6-luna", reasoning_effort="none")


async def build_graph(
    model: BaseChatModel | None = None,
    moderation_client: OpenAI | None = None,
):
    tools = await load_mcp_tools()
    return create_agent(  # pyright: ignore[reportCallIssue]
        model=model or _MODEL,
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
        # create_agent's AgentState typing rejects CopilotKitMiddleware's StateSchema; works at runtime.
        middleware=[
            ContentSafetyMiddleware(client=moderation_client),
            CopilotKitMiddleware(),  # pyright: ignore[reportArgumentType]
        ],
        checkpointer=MemorySaver(),
    )
