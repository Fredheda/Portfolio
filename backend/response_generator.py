from LLM.LLMClient import LLMClient
from LLM.prompts.prompt_manager import PromptManager

class ResponseGenerator:
    def __init__(self, chat_client: LLMClient, prompt_manager: PromptManager):
        """
        Initializes the ResponseGenerator with a chat client and a prompt manager.

        Args:
            chat_client (LLMClient): The chat client used to generate responses.
            prompt_manager (PromptManager): The prompt manager used to create messages.
        """
        self.chat_client = chat_client
        self.prompt_manager = prompt_manager

    def generate_response(self, user_input: str) -> str:
        """
        Generates a response based on the user input.

        Args:
            user_input (str): The input provided by the user.

        Returns:
            str: The generated response.
        """
        messages = self.prompt_manager.create_messages(user_input)
        response = self.chat_client.generate_chat_response(messages)
        return response