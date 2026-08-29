from typing import Any

from langchain.agents.middleware import AgentMiddleware, AgentState
from langchain.messages import AIMessage, HumanMessage
from langgraph.runtime import Runtime

from services.database_client import database_client


class LoggingMiddleware(AgentMiddleware):
    def __init__(self, db: database_client | None = None):
        super().__init__()
        self._db = db or database_client()

    def after_agent(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        messages = state["messages"]
        last_human = next(
            (m for m in reversed(messages) if isinstance(m, HumanMessage)), None
        )
        last_ai = next((m for m in reversed(messages) if isinstance(m, AIMessage)), None)

        if last_human is not None:
            self._db.log_chatbot_interaction(str(last_human.content), "user_input", 0)
        if last_ai is not None:
            self._db.log_chatbot_interaction(str(last_ai.content), "chatbot_response", 0)
        return None
