from pathlib import Path

from copilotkit import CopilotKitMiddleware
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver

from agent.content_safety_middleware import ContentSafetyMiddleware
from agent.logging_middleware import LoggingMiddleware
from agent.mcp_tools import load_mcp_tools

SYSTEM_PROMPT = (Path(__file__).parent / "system_prompt.md").read_text()

# gpt-5.6-luna rejects any temperature other than its default (1) with
# a 400 -- confirmed live, not just in docs -- so no temperature kwarg
# is passed here. It also 400s on tool calls over /v1/chat/completions
# unless reasoning_effort is explicitly set to "none" -- the string
# shorthand "openai:gpt-5.6-luna" can't express that, so the model is
# built explicitly instead.
_MODEL = ChatOpenAI(model="gpt-5.6-luna", reasoning_effort="none")


async def build_graph():
    tools = await load_mcp_tools()
    return create_agent(
        model=_MODEL,
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
        middleware=[
            ContentSafetyMiddleware(),
            CopilotKitMiddleware(),
            LoggingMiddleware(),
        ],
        checkpointer=MemorySaver(),
    )
