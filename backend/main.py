from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel
import asyncio
import os
from LLM.openai_client import OpenAIClient
from response_generator import ResponseGenerator
from LLM.prompts.prompt_manager import PromptManager
from services.openai_content_safety_service import ContentSafetyService


app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
origins = [os.getenv("REACT_APP_FRONTEND_URL")]

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST"]
)

# Define a request model
class Message(BaseModel):
    text: str

# Initialize the OpenAI client and message generator
openai_client = OpenAIClient()
prompt_manager = PromptManager()
content_safety = ContentSafetyService()
response_generator = ResponseGenerator(openai_client, prompt_manager)


# Run the custom message generator function asynchronously
async def get_LLM_response(user_input: str) -> str:
    loop = asyncio.get_event_loop()
    # Check if the input is safe
    flagged = await loop.run_in_executor(None, content_safety.classify_text, user_input)
    if flagged:
        return "Sorry, I cannot respond to that message."
    # Using asyncio to run the blocking function in a separate thread
    response = await loop.run_in_executor(None, response_generator.generate_response, user_input)
    return response

@app.post("/chatbot")
@limiter.limit("5/minute") 
async def get_response(message: Message, request: Request):
    # Call the asynchronous custom response function
    response = await get_LLM_response(message.text)
    return {"response": response}

if __name__ == "__main__":
    import uvicorn
    import os  
    port = int(os.environ.get("PORT", 8000)) 
    uvicorn.run(app, host="0.0.0.0", port=port)