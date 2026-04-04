import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from LLM.LLMClient import LLMClient, LLMResponse, ToolCall
_ = load_dotenv()


class GeminiClient(LLMClient):
    def __init__(self, tools: list = None, model: str = "gemini-2.5-flash-lite"):
        """
        Initializes the GeminiClient.

        Args:
            tools: List of tool definitions in the shared JSON schema format
                   (as loaded by ToolOrchestrator).
            model: Gemini model name to use for chat responses.
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set.")

        self.client = genai.Client(api_key=api_key)
        self.tools = self._build_tools(tools) if tools else None
        self.model = model

    def _build_tools(self, tools: list) -> list[types.Tool]:
        """
        Builds native Gemini Tool objects from the shared JSON schema format.
        The parameters field uses standard JSON Schema, which Gemini accepts natively.
        """
        declarations = [
            types.FunctionDeclaration(
                name=tool["name"],
                description=tool.get("description", ""),
                parameters=tool.get("parameters"),
            )
            for tool in tools
        ]
        return [types.Tool(function_declarations=declarations)]

    def generate_chat_response(self, messages: list) -> LLMResponse:
        """
        Generates a response using the Gemini API.

        Args:
            messages: List of message dicts with 'role' and 'content' keys.

        Returns:
            LLMResponse with text and any tool calls.
        """
        try:
            system_instruction = None
            contents = []

            for msg in messages:
                if msg["role"] == "system":
                    system_instruction = msg["content"]
                else:
                    role = "model" if msg["role"] == "assistant" else msg["role"]
                    contents.append(
                        types.Content(
                            role=role,
                            parts=[types.Part.from_text(text=msg["content"])]
                        )
                    )

            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                max_output_tokens=150,
                temperature=0,
                tools=self.tools,
            )

            raw = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=config,
            )

            tool_calls = [
                ToolCall(name=fc.name, arguments=dict(fc.args))
                for fc in (raw.function_calls or [])
            ]
            return LLMResponse(text=raw.text, tool_calls=tool_calls)

        except Exception as e:
            print(f"Gemini API error: {e}")
            return LLMResponse(text="I'm sorry, I'm having trouble processing your request right now.")

    def generate_embeddings(self, content: str, model: str = "gemini-embedding-001") -> list:
        """
        Generates embeddings using the Gemini API.

        Args:
            content: The text to embed.
            model: The embedding model to use.

        Returns:
            list: The embedding vector.
        """
        response = self.client.models.embed_content(
            model=model,
            contents=content,
        )
        return response.embeddings[0].values
