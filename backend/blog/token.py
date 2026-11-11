import asyncio
import logging
import time
from collections.abc import Callable
from typing import Protocol

from azure.core.credentials import AccessToken
from azure.identity import ManagedIdentityCredential

from blog.errors import BlogAuthError

logger = logging.getLogger("blog.token")
REFRESH_MARGIN_SECONDS = 300


class TokenProvider(Protocol):
    async def get(self) -> str: ...

    def invalidate(self) -> None: ...


class StaticTokenProvider:
    """Test seam for the browser suite (production never builds one)."""

    def __init__(self, token: str) -> None:
        self._token = token

    async def get(self) -> str:
        return self._token

    def invalidate(self) -> None:
        pass


class ManagedIdentityTokenProvider:
    """Token for the blog API's app registration, from this app's own
    user-assigned identity (client credentials, no secret). Cached until five
    minutes before expiry; one request at a time."""

    def __init__(
        self,
        client_id: str,
        audience: str,
        credential=None,
        clock: Callable[[], float] = time.time,
    ) -> None:
        self._scope = f"{audience.rstrip('/')}/.default"
        # The client id is required: the app has two identities, and the
        # default credential would pick neither reliably.
        self._credential = (
            credential
            if credential is not None
            else ManagedIdentityCredential(client_id=client_id)
        )
        self._clock = clock
        self._token: AccessToken | None = None
        self._lock = asyncio.Lock()

    def _fresh(self) -> AccessToken | None:
        token = self._token
        if (
            token is not None
            and token.expires_on - REFRESH_MARGIN_SECONDS > self._clock()
        ):
            return token
        return None

    async def get(self) -> str:
        token = self._fresh()
        if token is not None:
            return token.token
        async with self._lock:
            token = self._fresh()
            if token is None:
                try:
                    # The Azure SDK credential is synchronous: keep it off the event loop.
                    token = await asyncio.to_thread(
                        self._credential.get_token, self._scope
                    )
                except Exception as exc:
                    logger.warning("blog token request failed: %s", type(exc).__name__)
                    raise BlogAuthError() from None
                self._token = token
            return token.token

    def invalidate(self) -> None:
        self._token = None
