import asyncio
import logging

import pytest
from azure.core.credentials import AccessToken
from blog.errors import BlogAuthError
from blog.token import ManagedIdentityTokenProvider


class FakeCredential:
    def __init__(self, clock, lifetime=3600):
        self.clock = clock
        self.lifetime = lifetime
        self.scopes: list[tuple] = []
        self.error: Exception | None = None

    def get_token(self, *scopes):
        self.scopes.append(scopes)
        if self.error:
            raise self.error
        n = len(self.scopes)
        return AccessToken(f"token-{n}", int(self.clock() + self.lifetime))


class Clock:
    def __init__(self):
        self.now = 10_000.0

    def __call__(self):
        return self.now


def make():
    clock = Clock()
    credential = FakeCredential(clock)
    provider = ManagedIdentityTokenProvider(
        "client-id",
        "api://11111111-2222-3333-4444-555555555555",
        credential=credential,
        clock=clock,
    )
    return provider, credential, clock


@pytest.mark.asyncio
async def test_asks_for_the_api_audience_default_scope_and_reuses_the_token():
    provider, credential, _ = make()
    assert await provider.get() == "token-1"
    assert await provider.get() == "token-1"
    assert credential.scopes == [
        ("api://11111111-2222-3333-4444-555555555555/.default",)
    ]


@pytest.mark.asyncio
async def test_refreshes_before_the_token_expires():
    provider, credential, clock = make()
    await provider.get()
    clock.now += 3600 - 400  # 400 s left, margin is 300
    assert await provider.get() == "token-1"
    clock.now += 150  # 250 s left
    assert await provider.get() == "token-2"
    assert len(credential.scopes) == 2


@pytest.mark.asyncio
async def test_concurrent_callers_cause_one_token_request():
    provider, credential, _ = make()
    results = await asyncio.gather(*(provider.get() for _ in range(8)))
    assert set(results) == {"token-1"}
    assert len(credential.scopes) == 1


@pytest.mark.asyncio
async def test_invalidate_forces_a_new_token():
    provider, _, _ = make()
    await provider.get()
    provider.invalidate()
    assert await provider.get() == "token-2"


@pytest.mark.asyncio
async def test_a_credential_failure_leaks_nothing(caplog):
    provider, credential, _ = make()
    credential.error = RuntimeError("secret-looking text from the identity endpoint")
    with caplog.at_level(logging.DEBUG):
        with pytest.raises(BlogAuthError) as raised:
            await provider.get()
    assert str(raised.value) == ""
    assert raised.value.__cause__ is None and raised.value.__suppress_context__
    assert "secret-looking" not in caplog.text
    assert "RuntimeError" in caplog.text  # the class name is enough to debug
