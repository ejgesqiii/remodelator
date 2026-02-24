from __future__ import annotations

import pytest
from sqlalchemy import text

from remodelator.config import get_settings
from remodelator.infra.db import session_scope


def test_sqlite_runtime_pragmas_applied() -> None:
    settings = get_settings()
    if not settings.db_url.startswith("sqlite"):
        pytest.skip("SQLite pragma assertions apply only to sqlite backends.")

    synchronous_map = {"OFF": 0, "NORMAL": 1, "FULL": 2, "EXTRA": 3}

    with session_scope() as session:
        foreign_keys = session.execute(text("PRAGMA foreign_keys")).scalar_one()
        journal_mode = session.execute(text("PRAGMA journal_mode")).scalar_one()
        synchronous = session.execute(text("PRAGMA synchronous")).scalar_one()
        busy_timeout = session.execute(text("PRAGMA busy_timeout")).scalar_one()

    assert int(foreign_keys) == 1
    assert str(journal_mode).lower() == settings.sqlite_journal_mode.lower()
    assert int(synchronous) == synchronous_map[settings.sqlite_synchronous]
    assert int(busy_timeout) == settings.sqlite_busy_timeout_ms
