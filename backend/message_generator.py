from openai import OpenAI
import os
from dotenv import load_dotenv
_ = load_dotenv()

open_ai_key = os.getenv("OPEN_AI_KEY")
open_ai_organisation = os.getenv("OPEN_AI_ORG")


def generate_custom_message(user_input: str) -> str:
    try:
        client = OpenAI(api_key=open_ai_key)
        # Make a call to OpenAI's GPT-4 model
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_input}
            ],
            max_tokens=150,  # Limit the response length
            temperature=0.7,  # Adjust the creativity level (0.0 = deterministic, 1.0 = very creative)
        )
        response = completion.choices[0].message.content.strip()
        
        # Extract and return the assistant's response
        return response
    
    except Exception as e:
        print(f"Error communicating with OpenAI: {e}")
        return "I'm sorry, I'm having trouble processing your request right now."