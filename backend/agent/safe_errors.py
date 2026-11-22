"""ag-ui-langgraph 0.0.47 sends `str(exc)` to the browser, and a provider error can carry keys, hosts or the visitor's message: the client gets one fixed RUN_ERROR."""

import logging
from collections.abc import AsyncGenerator
from typing import Any

from ag_ui.core import EventType, RunAgentInput, RunErrorEvent, RunStartedEvent
from copilotkit import LangGraphAGUIAgent

logger = logging.getLogger(__name__)

GENERIC_RUN_ERROR = "The assistant hit an error. Please try again."

_TERMINAL = {EventType.RUN_ERROR, EventType.RUN_FINISHED}


def describe(exc: BaseException) -> str:
    if isinstance(exc, BaseExceptionGroup):
        inner = "; ".join(describe(e) for e in exc.exceptions)
        return f"{type(exc).__name__}({len(exc.exceptions)}): {inner}"
    status = getattr(exc, "status_code", None) or getattr(
        getattr(exc, "response", None), "status_code", None
    )
    name = type(exc).__name__
    return name if status is None else f"{name} status={status}"


class SafeErrorAgent(LangGraphAGUIAgent):
    async def run(self, input: RunAgentInput) -> AsyncGenerator[Any, None]:
        started = False
        terminal = False
        try:
            async for event in super().run(input):
                if event.type == EventType.RUN_STARTED:
                    started = True
                elif event.type == EventType.RUN_ERROR:
                    logger.error(
                        "Run error hidden from the client (code=%s)", event.code
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
            logger.error("Run failed: %s", describe(exc))
            if terminal:
                return
            if not started:
                yield RunStartedEvent(
                    type=EventType.RUN_STARTED,
                    thread_id=input.thread_id,
                    run_id=input.run_id,
                )
            yield RunErrorEvent(type=EventType.RUN_ERROR, message=GENERIC_RUN_ERROR)
