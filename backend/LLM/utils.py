from azure.search.documents.models import VectorizedQuery
from LLM.prompts.prompt_manager import PromptManager
from LLM.LLMClient import LLMClient
from azure.search.documents import SearchClient

class llm_utils:
    def __init__(self, llm_client: LLMClient, search_client: SearchClient, prompt_manager: PromptManager):
        self.llm_client = llm_client
        self.search_client = search_client
        self.prompt_manager = prompt_manager
    
    def retrieve_information(self, search_query: str):
        prompt_retrieved_context = self.prompt_manager.prompts["prompt_retrieved_context"]
        search_vector = self.llm_client.generate_embeddings(search_query)

        retrieved_information = self.search_client.search(
            search_text=None,
            vector_queries=[
                VectorizedQuery(vector=search_vector, k_nearest_neighbors=5, fields="embedding")
                ])
        
        retrieved_context = "The following information was retrieved:\n"
        for idx, doc in enumerate(retrieved_information, start=1):
            retrieved_context += prompt_retrieved_context.format(
                num=idx,
                document_name=doc["document_name"],
                content=doc["content"],
            )
        return retrieved_context