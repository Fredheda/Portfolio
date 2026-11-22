def describe(exc: BaseException) -> str:
    """Type and HTTP status only, never the message."""
    status = getattr(exc, "status_code", None) or getattr(
        getattr(exc, "response", None), "status_code", None
    )
    name = type(exc).__name__
    return name if status is None else f"{name} status={status}"
