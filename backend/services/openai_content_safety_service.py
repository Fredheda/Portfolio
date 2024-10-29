from openai import OpenAI
import os
from dotenv import load_dotenv
_ = load_dotenv()

class ContentSafetyService:
    def __init__(self):
        self.open_ai_key: str = os.getenv("OPENAI_API_KEY")
        if not self.open_ai_key:
            raise ValueError("OPENAI_API_KEY environment variable not set.")
        
        self.client: OpenAI = OpenAI(api_key=self.open_ai_key)

    def classify_text(self, text):
        response = self.client.moderations.create(
            model="omni-moderation-latest",
            input=text,
        )
        return response.results[0].flagged