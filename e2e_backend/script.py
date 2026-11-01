"""What the scripted model answers, chosen by keywords in the latest message."""

from uuid import uuid4

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage


def _tool_name(messages: list[BaseMessage], tool_call_id: str) -> str:
    # A frontend tool's result arrives from the browser without a name, so
    # look the name up on the call it answers.
    for message in reversed(messages):
        if isinstance(message, AIMessage):
            for call in message.tool_calls:
                if call["id"] == tool_call_id:
                    return call["name"]
    return "unknown"


def _tool_call(name: str, args: dict) -> AIMessage:
    return AIMessage(
        "", tool_calls=[{"id": f"call_{uuid4().hex}", "name": name, "args": args}]
    )


def plan_reply(messages: list[BaseMessage]) -> AIMessage:
    last = messages[-1]
    if isinstance(last, ToolMessage):
        return AIMessage(f"Done: {_tool_name(messages, last.tool_call_id)}.")

    text = next((m.text for m in reversed(messages) if isinstance(m, HumanMessage)), "")
    if "project details" in text:
        return _tool_call("get_project_details", {"project_id": "paper-podcasts"})
    if "show profile" in text:
        return _tool_call("get_profile", {})
    if "highlight" in text:
        return _tool_call(
            "highlightProjects", {"ids": ["paper-podcasts", "tfl-mcp-server"]}
        )
    return AIMessage(f"Reply to: {text}")
