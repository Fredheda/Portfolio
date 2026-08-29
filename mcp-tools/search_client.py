import os

from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from openai import OpenAI

_search_client: SearchClient | None = None
_openai_client: OpenAI | None = None


def _get_search_client() -> SearchClient:
    global _search_client
    if _search_client is None:
        _search_client = SearchClient(
            endpoint=os.environ["azure_search_endpoint"],
            index_name=os.environ["azure_index_name"],
            credential=AzureKeyCredential(os.environ["azure_search_api_key"]),
        )
    return _search_client


def _get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _openai_client


def retrieve_information(
    search_query: str,
    search_client: SearchClient | None = None,
    openai_client: OpenAI | None = None,
) -> str:
    search_client = search_client or _get_search_client()
    openai_client = openai_client or _get_openai_client()

    embedding = (
        openai_client.embeddings.create(
            model="text-embedding-3-large", input=search_query
        )
        .data[0]
        .embedding
    )

    results = search_client.search(
        search_text=None,
        vector_queries=[
            VectorizedQuery(vector=embedding, k_nearest_neighbors=5, fields="embedding")
        ],
    )

    chunks = [
        f"[{idx}] {doc['document_name']}: {doc['content']}"
        for idx, doc in enumerate(results, start=1)
    ]
    if not chunks:
        return "No relevant information was found."
    return "The following information was retrieved:\n" + "\n".join(chunks)
