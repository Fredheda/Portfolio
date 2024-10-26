from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from message_generator import generate_custom_message
import os
from dotenv import load_dotenv
#_ = load_dotenv()

app = FastAPI()

origins = [
    os.getenv("REACT_APP_FRONTEND_URL")
]

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

# Run the custom message generator function asynchronously
async def get_custom_response(user_input: str) -> str:
    # Using asyncio to run the blocking function in a separate thread
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, generate_custom_message, user_input)
    return response

@app.post("/chatbot")
async def get_response(message: Message):
    # Call the asynchronous custom response function
    custom_response = await get_custom_response(message.text)
    return {"response": custom_response}

if __name__ == "__main__":
    import uvicorn
    import os  
    port = int(os.environ.get("PORT", 8000)) 
    uvicorn.run(app, host="0.0.0.0", port=port)