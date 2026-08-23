import json
import logging

import azure.functions as func

from content_loader import load_content
from search_client import retrieve_information as _retrieve_information

app = func.FunctionApp()

_LIST_PROJECTS_PROPERTIES = json.dumps([])

_GET_PROJECT_DETAILS_PROPERTIES = json.dumps(
    [
        {
            "propertyName": "project_id",
            "propertyType": "string",
            "description": "The stable id of the project, e.g. 'paper-podcasts'.",
            "isRequired": True,
        }
    ]
)

_RETRIEVE_INFORMATION_PROPERTIES = json.dumps(
    [
        {
            "propertyName": "search_query",
            "propertyType": "string",
            "description": "A short natural-language query describing what to search for.",
            "isRequired": True,
        }
    ]
)


@app.mcp_tool_trigger(
    arg_name="context",
    tool_name="list_projects",
    description="List all portfolio projects with their id, title, and short description.",
    tool_properties=_LIST_PROJECTS_PROPERTIES,
)
def list_projects(context) -> str:
    projects = load_content()["projects"]
    summary = [
        {"id": p["id"], "title": p["title"], "description": p["description"]}
        for p in projects
    ]
    return json.dumps(summary)


@app.mcp_tool_trigger(
    arg_name="context",
    tool_name="get_project_details",
    description="Get full details (title, description, link, categories) for one project by id.",
    tool_properties=_GET_PROJECT_DETAILS_PROPERTIES,
)
def get_project_details(context) -> str:
    invocation = json.loads(context)
    project_id = invocation["arguments"].get("project_id")
    if not project_id:
        return json.dumps({"error": "project_id is required"})

    projects = load_content()["projects"]
    match = next((p for p in projects if p["id"] == project_id), None)
    if match is None:
        known_ids = ", ".join(p["id"] for p in projects)
        return json.dumps({"error": f"No project with id '{project_id}'. Known ids: {known_ids}"})

    logging.info("get_project_details: returning %s", project_id)
    return json.dumps(match)


@app.mcp_tool_trigger(
    arg_name="context",
    tool_name="retrieve_information",
    description="Search Frederik's background documents (CV, project write-ups, bio) for information relevant to a query.",
    tool_properties=_RETRIEVE_INFORMATION_PROPERTIES,
)
def retrieve_information(context) -> str:
    invocation = json.loads(context)
    search_query = invocation["arguments"].get("search_query")
    if not search_query:
        return "Error: search_query is required."
    return _retrieve_information(search_query)
