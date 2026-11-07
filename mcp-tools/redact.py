"""Replace secret-shaped substrings in text that is about to be logged.

Generous on purpose: a false positive costs a few characters of a log line,
a miss puts a key prefix, an organisation name, a request id or a header
value into the Function App log. The tool's client-facing text is never
filtered (it is a fixed string); this guards the operator's log line only.
"""

import re

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
    for pattern, replacement in _PATTERNS:
        text = pattern.sub(replacement, text)
    return text
