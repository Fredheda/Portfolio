"""A chat model that answers from script.py and records every call.

It streams the shapes ChatOpenAI produces over chat completions (the API this
backend uses): text as content chunks, tool calls as tool_call_chunks.
"""

import json
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessageChunk, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatGenerationChunk, ChatResult
from langchain_core.utils.function_calling import convert_to_openai_tool
from pydantic import Field

from e2e_backend.script import plan_reply


class ScriptedChatModel(BaseChatModel):
    calls: list[dict] = Field(default_factory=list)
    fail_next: bool = False

    @property
    def _llm_type(self) -> str:
        return "scripted"

    def bind_tools(self, tools, *, tool_choice=None, **kwargs):  # type: ignore[override]
        return self.bind(tools=[convert_to_openai_tool(t) for t in tools], **kwargs)

    def _reply(self, messages: list[BaseMessage], kwargs: dict[str, Any]):
        system = messages[0].text if messages and messages[0].type == "system" else ""
        self.calls.append(
            {
                "system": system,
                "tools": sorted(t["function"]["name"] for t in kwargs.get("tools", [])),
                "messages": [
                    {
                        "type": m.type,
                        "text": m.text,
                        "name": getattr(m, "name", None),
                        "tool_calls": getattr(m, "tool_calls", []),
                    }
                    for m in messages
                ],
            }
        )
        if self.fail_next:
            self.fail_next = False
            raise RuntimeError("scripted model failure")
        return plan_reply(messages)

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        return ChatResult(
            generations=[ChatGeneration(message=self._reply(messages, kwargs))]
        )

    def _stream(self, messages, stop=None, run_manager=None, **kwargs):
        reply = self._reply(messages, kwargs)
        if reply.tool_calls:
            call = reply.tool_calls[0]
            yield ChatGenerationChunk(
                message=AIMessageChunk(
                    content="",
                    tool_call_chunks=[
                        {
                            "name": call["name"],
                            "args": json.dumps(call["args"]),
                            "id": call["id"],
                            "index": 0,
                        }
                    ],
                )
            )
            return
        words = reply.text.split(" ")
        third = max(1, len(words) // 3)
        pieces = [
            " ".join(words[:third]),
            " ".join(words[third : 2 * third]),
            " ".join(words[2 * third :]),
        ]
        for i, piece in enumerate(p for p in pieces if p):
            token = piece if i == 0 else " " + piece
            if run_manager:
                run_manager.on_llm_new_token(token)
            yield ChatGenerationChunk(message=AIMessageChunk(content=token))
