from __future__ import annotations

import json
from pathlib import Path

from remodelator.config import get_settings


settings = get_settings()


def get_current_user_id() -> str | None:
    session_file = Path(settings.session_file)
    if not session_file.exists():
        return None
    data = json.loads(session_file.read_text())
    return data.get("user_id")


def set_current_user_id(user_id: str | None) -> None:
    session_file = Path(settings.session_file)
    if user_id is None:
        if session_file.exists():
            session_file.unlink()
        return
    session_file.write_text(json.dumps({"user_id": user_id}, indent=2))
