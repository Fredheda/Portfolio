from typing import Any

from langchain.agents.middleware import AgentMiddleware, AgentState, hook_config
from langchain.messages import AIMessage, HumanMessage
from langgraph.runtime import Runtime
from openai import OpenAI

REFUSAL_MESSAGE = "Sorry, I cannot respond to that message."


class ContentSafetyMiddleware(AgentMiddleware):
    def __init__(self, client: OpenAI | None = None):
        super().__init__()
        self._client = client or OpenAI()

    @hook_config(can_jump_to=["end"])
    def before_model(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        last_human = next(
            (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None
        )
        if last_human is None:
            return None

        response = self._client.moderations.create(
            model="omni-moderation-latest", input=last_human.content
        )
        if response.results[0].flagged:
            return {"messages": [AIMessage(REFUSAL_MESSAGE)], "jump_to": "end"}
        return None
