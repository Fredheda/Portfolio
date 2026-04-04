from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ToolCall:
    name: str
    arguments: dict


@dataclass
class LLMResponse:
    text: str | None
    tool_calls: list[ToolCall] = field(default_factory=list)


class LLMClient(ABC):
    @abstractmethod
    def generate_chat_response(self, messages: list) -> LLMResponse:
        pass

    @abstractmethod
    def generate_embeddings(self, content: str) -> list:
        pass
