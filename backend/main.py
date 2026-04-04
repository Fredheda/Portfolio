from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, field_validator
import asyncio
import logging
import os
from LLM.gemini_client import GeminiClient
from LLM.openai_client import OpenAIClient
from services.database_client import database_client
from LLM.rag_client import ragClient
from LLM.utils import llm_utils
from LLM.tools.tool_orchestrator import ToolOrchestrator
from LLM.prompts.prompt_manager import PromptManager
from services.openai_content_safety_service import ContentSafetyService
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential


app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    message = exc.errors()[0]["msg"].replace("Value error, ", "")
    logging.warning(f"400 Bad Request - {request.url.path}: {message}")
    return JSONResponse(status_code=400, content={"error": message})
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

    @field_validator("text")
    @classmethod
    def check_length(cls, v):
        if len(v) > 150:
            raise ValueError("Message must be 150 characters or fewer.")
        return v

# Initialize clients and services
prompt_manager = PromptManager()
database_client = database_client()
content_safety = ContentSafetyService()
tool_orchestrator = ToolOrchestrator()
tools = tool_orchestrator.get_tools(["LLM/tools/retrieve_information"])
gemini_client = GeminiClient(tools)
openai_client = OpenAIClient()  # used for embeddings only
search_client = SearchClient(
            endpoint=os.getenv("azure_search_endpoint"),
            index_name=os.getenv("azure_index_name"),
            credential=AzureKeyCredential(os.getenv("azure_search_api_key"))
            )

llm_utils = llm_utils(openai_client, search_client, prompt_manager)
rag_client = ragClient(gemini_client, llm_utils, database_client, prompt_manager)


# Run the custom message generator function asynchronously
async def get_LLM_response(user_input: str) -> str:
    loop = asyncio.get_event_loop()
    # Check if the input is safe
    flagged = await loop.run_in_executor(None, content_safety.classify_text, user_input)
    if flagged:
        return "Sorry, I cannot respond to that message."
    # Using asyncio to run the blocking function in a separate thread
    response = await loop.run_in_executor(None, rag_client.generate_rag_response, user_input)
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