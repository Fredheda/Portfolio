from LLM.LLMClient import LLMClient
from LLM.prompts.prompt_manager import PromptManager

class ResponseGenerator:
    def __init__(self, chat_client: LLMClient, prompt_manager: PromptManager):
        self.chat_client = chat_client
        self.prompt_manager = prompt_manager

    def generate_response(self, user_input: str) -> str:
        messages = self.prompt_manager.create_messages(user_input)
        response = self.chat_client.generate_chat_response(messages)
        return response