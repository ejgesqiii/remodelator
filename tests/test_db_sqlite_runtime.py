from __future__ import annotations

import pytest
from sqlalchemy import text

from remodelator.application import service
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


def test_sqlite_billing_indexes_exist_after_migrate() -> None:
    settings = get_settings()
    if not settings.db_url.startswith("sqlite"):
        pytest.skip("SQLite index assertions apply only to sqlite backends.")

    service.init_db()

    with session_scope() as session:
        user_indexes = {
            str(row[1]) for row in session.execute(text("PRAGMA index_list(users)")).all()
        }
        billing_indexes = {
            str(row[1]) for row in session.execute(text("PRAGMA index_list(billing_events)")).all()
        }
        idempotency_indexes = {
            str(row[1]) for row in session.execute(text("PRAGMA index_list(idempotency_records)")).all()
        }

    assert "ix_users_stripe_customer_id" in user_indexes
    assert "ix_users_stripe_subscription_id" in user_indexes
    assert "ix_billing_events_user_created_at" in billing_indexes
    assert "ix_billing_events_user_event_created_at" in billing_indexes
    assert "ix_idempotency_records_scope_user_key" in idempotency_indexes
