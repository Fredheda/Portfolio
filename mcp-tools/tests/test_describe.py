from types import SimpleNamespace

from describe import describe

PLANTED = (
    "Error code: 401 - Incorrect API key provided (sk-proj-PLANTEDKEY1234). "
    "organization org-PLANTEDORG request req_PLANTEDREQ"
)


class RateLimited(Exception):
    status_code = 429


def test_describe_gives_the_type_and_never_the_message():
    assert describe(RuntimeError(PLANTED)) == "RuntimeError"


def test_describe_adds_the_status_of_a_provider_error():
    assert describe(RateLimited(PLANTED)) == "RateLimited status=429"


def test_describe_reads_the_status_of_an_http_response():
    error = RuntimeError(PLANTED)
    error.response = SimpleNamespace(status_code=401)  # type: ignore[attr-defined]
    assert describe(error) == "RuntimeError status=401"
