import json

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
