from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import os
from LLM.openai_client import OpenAIClient
from response_generator import ResponseGenerator
from LLM.prompts.prompt_manager import PromptManager


app = FastAPI()

origins = [os.getenv("REACT_APP_FRONTEND_URL")]

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define a request model
class Message(BaseModel):
    text: str

# Initialize the OpenAI client and message generator
openai_client = OpenAIClient()
prompt_manager = PromptManager()
response_generator = ResponseGenerator(openai_client, prompt_manager)


# Run the custom message generator function asynchronously
async def get_LLM_response(user_input: str) -> str:
    # Using asyncio to run the blocking function in a separate thread
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, response_generator.generate_response, user_input)
    return response

@app.post("/chatbot")
async def get_response(message: Message):
    # Call the asynchronous custom response function
    response = await get_LLM_response(message.text)
    return {"response": response}

if __name__ == "__main__":
    import uvicorn
    import os  
    port = int(os.environ.get("PORT", 8000)) 
    uvicorn.run(app, host="0.0.0.0", port=port)