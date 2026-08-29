import json
from unittest.mock import MagicMock

import function_app


def test_list_projects_returns_all_ids():
    result = json.loads(function_app.list_projects(context="{}"))
    ids = {p["id"] for p in result}
    assert "paper-podcasts" in ids
    assert "tfl-mcp-server" in ids
    assert len(result) == 4


def test_get_project_details_returns_full_record():
    context = json.dumps({"arguments": {"project_id": "paper-podcasts"}})
    result = json.loads(function_app.get_project_details(context=context))
    assert result["id"] == "paper-podcasts"
    assert result["link"] == "https://github.com/Fredheda/paper-podcasts"
    assert "categories" in result


def test_get_project_details_unknown_id_returns_error():
    context = json.dumps({"arguments": {"project_id": "does-not-exist"}})
    result = json.loads(function_app.get_project_details(context=context))
    assert "error" in result


def test_retrieve_information_formats_results(monkeypatch):
    fake_embedding = MagicMock()
    fake_embedding.data = [MagicMock(embedding=[0.1, 0.2, 0.3])]
    fake_openai = MagicMock()
    fake_openai.embeddings.create.return_value = fake_embedding

    fake_search = MagicMock()
    fake_search.search.return_value = [
        {"document_name": "cv.pdf", "content": "Led BP's GenAI transformation."}
    ]

    monkeypatch.setattr(
        function_app, "_retrieve_information",
        lambda q: function_app_search_client.retrieve_information(
            q, search_client=fake_search, openai_client=fake_openai
        ),
    )

    import search_client as function_app_search_client  # local import to satisfy monkeypatch above

    context = '{"arguments": {"search_query": "GenAI leadership"}}'
    result = function_app.retrieve_information(context=context)
    assert "cv.pdf" in result
    assert "Led BP's GenAI transformation." in result


def test_retrieve_information_missing_query_returns_error():
    context = '{"arguments": {}}'
    result = function_app.retrieve_information(context=context)
    assert result.startswith("Error:")
