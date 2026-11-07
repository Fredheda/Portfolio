"""Keep provider error text out of the AG-UI stream.

ag-ui-langgraph 0.0.42 lets an exception escape `run()`, which aborts the SSE
stream with no RUN_ERROR; 0.0.47 catches it and sends RUN_ERROR with
`str(exc)` and the upstream event as `raw_event`. A model or transport error
can carry a key prefix, an organisation name, a request id, a host or a header
value. This wrapper gives the client one fixed RUN_ERROR either way, never a
second terminal event, and logs the real error with secret-shaped parts
replaced. The client-facing text is a constant, never a filtered string.
"""

import logging
import re
from collections.abc import AsyncGenerator
from typing import Any

from ag_ui.core import EventType, RunAgentInput, RunErrorEvent, RunStartedEvent
from copilotkit import LangGraphAGUIAgent

logger = logging.getLogger(__name__)

GENERIC_RUN_ERROR = "The assistant hit an error. Please try again."

_TERMINAL = {EventType.RUN_ERROR, EventType.RUN_FINISHED}

_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\bsk-[A-Za-z0-9_-]{8,}"), "[redacted-key]"),
    (re.compile(r"\borg-[A-Za-z0-9_-]{8,}"), "[redacted-org]"),
    (re.compile(r"\breq_[A-Za-z0-9_-]{8,}"), "[redacted-request]"),
    (re.compile(r"https?://[^\s'\"<>]+"), "[redacted-url]"),
    (
        re.compile(
            r"(?i)\b(bearer|api-key|x-functions-key|authorization)\b[\s:=]*"
            r"(?:bearer\s+)?[^\s'\",;]+"
        ),
        r"\1 [redacted-credential]",
    ),
)


def redact(text: str) -> str:
    """Replace secret-shaped substrings; generous on purpose (log lines only)."""
    for pattern, replacement in _PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def describe(exc: BaseException) -> str:
    """Type and message, with exception groups flattened (anyio transport errors)."""
    if isinstance(exc, BaseExceptionGroup):
        inner = "; ".join(describe(e) for e in exc.exceptions)
        return f"{type(exc).__name__}({len(exc.exceptions)}): {inner}"
    return f"{type(exc).__name__}: {exc}"


class SafeErrorAgent(LangGraphAGUIAgent):
    """`LangGraphAGUIAgent` whose failed runs end with a fixed RUN_ERROR."""

    async def run(self, input: RunAgentInput) -> AsyncGenerator[Any, None]:
        started = False
        terminal = False
        try:
            async for event in super().run(input):
                if event.type == EventType.RUN_STARTED:
                    started = True
                elif event.type == EventType.RUN_ERROR:
                    logger.error(
                        "Run error hidden from the client: %s", redact(event.message)
                    )
                    event = event.model_copy(
                        update={
                            "message": GENERIC_RUN_ERROR,
                            "code": None,
                            "raw_event": None,
                        }
                    )
                if event.type in _TERMINAL:
                    terminal = True
                yield event
        except Exception as exc:
            logger.error("Run failed: %s", redact(describe(exc)))
            if terminal:
                return
            if not started:
                yield RunStartedEvent(
                    type=EventType.RUN_STARTED,
                    thread_id=input.thread_id,
                    run_id=input.run_id,
                )
            yield RunErrorEvent(type=EventType.RUN_ERROR, message=GENERIC_RUN_ERROR)
