from LLM.LLMClient import LLMClient
from LLM.prompts.prompt_manager import PromptManager
from services.database_client import database_client
from datetime import datetime

class ResponseGenerator:
    def __init__(self,rag_client,  chat_client: LLMClient, database_client: database_client, prompt_manager: PromptManager):
        """
        Initializes the ResponseGenerator with a chat client and a prompt manager.

        Args:
            chat_client (LLMClient): The chat client used to generate responses.
            prompt_manager (PromptManager): The prompt manager used to create messages.
        """
        self.rag_client = rag_client
        self.chat_client = chat_client
        self.database_client = database_client
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
    
    def generate_rag_response(self, user_input: str) -> str:
        """
        Generates a response based on the user input.

        Args:
            user_input (str): The input provided by the user.

        Returns:
            str: The generated response.
        """
        start_time = datetime.now()
        self.database_client.log_chatbot_interaction(user_input, "user_input", 0)
        messages = self.prompt_manager.create_messages(user_input)
        response = self.rag_client.generate_rag_response(messages)
        duration = (datetime.now() - start_time).seconds
        self.database_client.log_chatbot_interaction(response, "chatbot_response", duration)

        return response