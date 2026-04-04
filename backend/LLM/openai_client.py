import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from LLM.LLMClient import LLMClient, LLMResponse, ToolCall
_ = load_dotenv()

class OpenAIClient(LLMClient):
    def __init__(self, tools: list = None):
        self.open_ai_key: str = os.getenv("OPENAI_API_KEY")
        if not self.open_ai_key:
            raise ValueError("OPENAI_API_KEY environment variable not set.")

        self.client: OpenAI = OpenAI(api_key=self.open_ai_key)
        self.tools = tools

    def generate_chat_response(self, messages: list) -> LLMResponse:
        try:
            raw = self.client.responses.create(
                model="gpt-4.1-nano",
                input=messages,
                tools=self.tools,
                max_output_tokens=150,
                temperature=0,
            )
            tool_calls = [
                ToolCall(name=item.name, arguments=json.loads(item.arguments))
                for item in raw.output
                if item.type == "function_call"
            ]
            return LLMResponse(text=raw.output_text, tool_calls=tool_calls)

        except Exception as e:
            return LLMResponse(text="I'm sorry, I'm having trouble processing your request right now.")

    def generate_embeddings(self, content: str, model: str = "text-embedding-3-large") -> list:
        response = self.client.embeddings.create(
            model=model,
            input=content
        )
        return response.data[0].embedding
