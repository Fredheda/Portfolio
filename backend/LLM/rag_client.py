from dotenv import load_dotenv
from datetime import datetime
from LLM.LLMClient import LLMClient
from LLM.utils import llm_utils
from services.database_client import database_client
from LLM.prompts.prompt_manager import PromptManager
_ = load_dotenv()

class ragClient():
    def __init__(self, chatclient: LLMClient, llm_utils: llm_utils, database_client: database_client, prompt_manager: PromptManager):
        self.chatclient = chatclient
        self.llm_utils = llm_utils
        self.database_client = database_client
        self.prompt_manager = prompt_manager

    def generate_rag_response(self, user_input: str) -> str:
        start_time = datetime.now()
        self.database_client.log_chatbot_interaction(user_input, "user_input", 0)

        messages = self.prompt_manager.create_messages(user_input)
        response = self.chatclient.generate_chat_response(messages)

        if response.tool_calls:
            tool_call = response.tool_calls[0]
            if tool_call.name == "retrieve_information":
                tool_results = self.llm_utils.retrieve_information(
                    search_query=tool_call.arguments["search_query"]
                )
                self.database_client.log_chatbot_interaction(
                    tool_call.arguments["search_query"], "tool_search_query", 0
                )
                messages = self.prompt_manager.update_messages_with_toolcalls(
                    messages, tool_call.name, tool_call.arguments["search_query"], tool_results
                )
                response = self.chatclient.generate_chat_response(messages)

        duration = (datetime.now() - start_time).seconds
        self.database_client.log_chatbot_interaction(response.text, "chatbot_response", duration)
        return response.text
