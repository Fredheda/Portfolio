import pytest
from redact import redact

PLANTED_OPENAI = (
    "Error code: 401 - Incorrect API key provided (sk-proj-PLANTEDKEY1234). "
    "organization org-PLANTEDORG request req_PLANTEDREQ"
)


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("key sk-proj-PLANTEDKEY1234 here", "key [redacted-key] here"),
        ("organization org-PLANTEDORG", "organization [redacted-org]"),
        ("request req_PLANTEDREQ", "request [redacted-request]"),
        (
            "at https://planted-search.search.windows.net/indexes?api-key=sk-PLANTEDQUERYKEY now",
            "at [redacted-url] now",
        ),
        ("api-key: PLANTEDSEARCHKEY", "api-key [redacted-credential]"),
        ("Authorization: Bearer PLANTEDTOKEN", "Authorization [redacted-credential]"),
        ("x-functions-key=PLANTEDFUNCKEY", "x-functions-key [redacted-credential]"),
    ],
)
def test_redact_replaces_each_secret_shape(text, expected):
    assert redact(text) == expected


def test_redact_handles_several_secrets_in_one_message():
    assert redact(PLANTED_OPENAI) == (
        "Error code: 401 - Incorrect API key provided ([redacted-key]). "
        "organization [redacted-org] request [redacted-request]"
    )


@pytest.mark.parametrize(
    "text",
    ["", "No relevant information was found.", "Error code: 429 - rate limited"],
)
def test_redact_leaves_plain_text_alone(text):
    assert redact(text) == text
