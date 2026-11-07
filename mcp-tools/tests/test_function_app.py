import json
import logging
from unittest.mock import MagicMock

import function_app

PLANTED_OPENAI = (
    "Error code: 401 - Incorrect API key provided (sk-proj-PLANTEDKEY1234). "
    "organization org-PLANTEDORG request req_PLANTEDREQ"
)
PLANTED_SEARCH = (
    "(InvalidRequest) https://planted-search.search.windows.net/indexes('planted-index') "
    "api-key: PLANTEDSEARCHKEY request req_PLANTEDSEARCH"
)
SEARCH_CONTEXT = '{"arguments": {"search_query": "GenAI leadership"}}'


def _retrieve_with(monkeypatch, *, openai_error=None, search_error=None):
    """Route function_app's search through fakes, one of which raises."""
    import search_client as function_app_search_client

    fake_embedding = MagicMock()
    fake_embedding.data = [MagicMock(embedding=[0.1, 0.2, 0.3])]
    fake_openai = MagicMock()
    fake_openai.embeddings.create.return_value = fake_embedding
    if openai_error is not None:
        fake_openai.embeddings.create.side_effect = openai_error

    fake_search = MagicMock()
    fake_search.search.return_value = []
    if search_error is not None:
        fake_search.search.side_effect = search_error

    monkeypatch.setattr(
        function_app,
        "_retrieve_information",
        lambda q: function_app_search_client.retrieve_information(
            q, search_client=fake_search, openai_client=fake_openai
        ),
    )


def test_list_projects_returns_plain_english_fields():
    result = json.loads(function_app.list_projects(context="{}"))
    assert {p["id"] for p in result} >= {"paper-podcasts", "tfl-mcp-server"}
    for project in result:
        assert set(project) == {"id", "title", "plainEnglish", "techLine"}


def test_get_profile_returns_page_content():
    result = json.loads(function_app.get_profile(context="{}"))
    assert set(result) == {"profile", "about", "experience", "posts"}
    assert result["profile"]["name"] == "Frederik Heda"


# A known id's full record is checked end to end, over MCP, by the browser
# suite (frontend/e2e/full-stack/tools.spec.js).


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
        function_app,
        "_retrieve_information",
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


def test_retrieve_information_hides_an_openai_error(monkeypatch, caplog):
    _retrieve_with(monkeypatch, openai_error=RuntimeError(PLANTED_OPENAI))
    with caplog.at_level(logging.ERROR):
        result = function_app.retrieve_information(context=SEARCH_CONTEXT)
    assert result == function_app.SEARCH_UNAVAILABLE
    assert "RuntimeError" in caplog.text
    assert "[redacted-key]" in caplog.text
    for planted in ("sk-proj-PLANTEDKEY1234", "org-PLANTEDORG", "req_PLANTEDREQ"):
        assert planted not in caplog.text
        assert planted not in result


def test_retrieve_information_hides_a_search_error(monkeypatch, caplog):
    _retrieve_with(monkeypatch, search_error=RuntimeError(PLANTED_SEARCH))
    with caplog.at_level(logging.ERROR):
        result = function_app.retrieve_information(context=SEARCH_CONTEXT)
    assert result == function_app.SEARCH_UNAVAILABLE
    assert "RuntimeError" in caplog.text
    assert "[redacted-url]" in caplog.text
    for planted in (
        "planted-search.search.windows.net",
        "PLANTEDSEARCHKEY",
        "req_PLANTEDSEARCH",
        "planted-index",
    ):
        assert planted not in result
    for planted in (
        "planted-search.search.windows.net",
        "PLANTEDSEARCHKEY",
        "req_PLANTEDSEARCH",
    ):
        assert planted not in caplog.text
