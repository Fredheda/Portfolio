import json
from functools import lru_cache
from pathlib import Path

CONTENT_PATH = Path(__file__).parent / "content" / "site-content.json"


@lru_cache(maxsize=1)
def load_content() -> dict:
    return json.loads(CONTENT_PATH.read_text())
