from dotenv import load_dotenv
import os
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from openai import OpenAI
from langchain_text_splitters import MarkdownHeaderTextSplitter
from azure.search.documents.indexes.models import (
    HnswAlgorithmConfiguration,
    HnswParameters,
    SearchField,
    SearchFieldDataType,
    SearchIndex,
    SimpleField,
    VectorSearch,
    VectorSearchAlgorithmKind,
    VectorSearchProfile,
)

_= load_dotenv()


class IndexCreator:
    def __init__(self):
        self.search_endpoint = os.getenv("azure_search_endpoint")
        self.search_api_key = os.getenv("azure_search_api_key")
        self.index_name = os.getenv("azure_index_name")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.search_credential = AzureKeyCredential(self.search_api_key)
        self.model_name = os.getenv("EMBEDDING_MODEL_NAME")

        # Initialize clients
        self.index_client = SearchIndexClient(endpoint=self.search_endpoint, credential=AzureKeyCredential(self.search_api_key))
        self.search_client = SearchClient(endpoint=self.search_endpoint, index_name=self.index_name, credential=self.search_credential)

        self.OAI_Client = OpenAI(api_key=self.openai_api_key)

    def create_embedding(self, content):
        response = self.OAI_Client.embeddings.create(
            model = self.model_name,
            input = content
        )
        return response.data[0].embedding
    
    def create_index(self):
        index = SearchIndex(
            name=self.index_name, 
            fields=[
                SimpleField(name="document_name", type=SearchFieldDataType.String, key=True),
                SearchField(name="content", type=SearchFieldDataType.String, searchable=True),
                SearchField(name="embedding", 
                            type=SearchFieldDataType.Collection(SearchFieldDataType.Single), 
                            searchable=True, 
                            vector_search_dimensions=3072,
                            vector_search_profile_name="embedding_profile")
            ],
            vector_search=VectorSearch(
                algorithms=[HnswAlgorithmConfiguration( # Hierachical Navigable Small World, IVF
                                    name="hnsw_config",
                                    kind=VectorSearchAlgorithmKind.HNSW,
                                    parameters=HnswParameters(metric="cosine"),
                                )],
                profiles=[VectorSearchProfile(name="embedding_profile", algorithm_configuration_name="hnsw_config")]
            )
        )
        result = self.index_client.create_or_update_index(index)
        print(f'{result.name} created')
    
    def upload_documents(self, document_list):
        documents=[
            {"document_name": document_list[i]['header'], 
             "content": document_list[i]['content'],
             "embedding": self.create_embedding(document_list[i]['content'])} for i in range(len(document_list))
             ]
        response = self.search_client.upload_documents(documents=documents)
        print(f"Uploaded {len(documents)} documents to the index.")
    
    def index_exists(self, index_name):
        try:
            self.index_client.get_index(index_name)
            return True
        except Exception as e:
            return False
    
    def delete_all_documents(self):
        try:
            # Retrieve all documents in the index
            documents = self.search_client.search(search_text="*", include_total_count=True)
            document_keys = [doc['document_name'] for doc in documents]

            # Delete documents by their keys
            self.search_client.delete_documents(documents=[{"document_name": key} for key in document_keys])
            print(f"Deleted {len(document_keys)} documents from the index.")
        except Exception as e:
            print(f"An error occurred while deleting documents: {e}")