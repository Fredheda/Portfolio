from abc import ABC, abstractmethod

class LLMClient(ABC):
    @abstractmethod
    def generate_chat_response(self, user_input: str) -> str:
        pass