from __future__ import annotations

import pytest
from sqlalchemy import create_engine, text

from remodelator.application import service
from remodelator.config import get_settings
import remodelator.infra.db as db_module
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


def test_sqlite_migrate_backfills_stripe_columns_for_legacy_users_table(tmp_path, monkeypatch) -> None:
    legacy_db_path = tmp_path / "legacy.sqlite3"
    legacy_engine = create_engine(f"sqlite:///{legacy_db_path}", future=True)

    with legacy_engine.begin() as connection:
        connection.exec_driver_sql(
            """
            CREATE TABLE users (
                id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(255) UNIQUE,
                password_hash VARCHAR(128),
                full_name VARCHAR(255),
                labor_rate NUMERIC(12,4),
                default_item_markup_pct NUMERIC(8,4),
                default_estimate_markup_pct NUMERIC(8,4),
                tax_rate_pct NUMERIC(8,4),
                created_at DATETIME
            )
            """
        )

    monkeypatch.setattr(db_module, "engine", legacy_engine)
    monkeypatch.setattr(db_module, "is_sqlite", True)

    db_module.create_schema()

    with legacy_engine.connect() as connection:
        user_columns = {str(row[1]) for row in connection.exec_driver_sql("PRAGMA table_info(users)").all()}

    legacy_engine.dispose()

    assert "stripe_customer_id" in user_columns
    assert "stripe_subscription_id" in user_columns


def test_sqlite_migrate_clears_invalid_checkout_session_subscription_ids(tmp_path, monkeypatch) -> None:
    legacy_db_path = tmp_path / "invalid-subscription.sqlite3"
    legacy_engine = create_engine(f"sqlite:///{legacy_db_path}", future=True)

    with legacy_engine.begin() as connection:
        connection.exec_driver_sql(
            """
            CREATE TABLE users (
                id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(255) UNIQUE,
                password_hash VARCHAR(128),
                full_name VARCHAR(255),
                labor_rate NUMERIC(12,4),
                default_item_markup_pct NUMERIC(8,4),
                default_estimate_markup_pct NUMERIC(8,4),
                tax_rate_pct NUMERIC(8,4),
                stripe_customer_id VARCHAR(255),
                stripe_subscription_id VARCHAR(255),
                created_at DATETIME
            )
            """
        )
        connection.exec_driver_sql(
            """
            INSERT INTO users (
                id, email, password_hash, full_name, labor_rate, default_item_markup_pct,
                default_estimate_markup_pct, tax_rate_pct, stripe_customer_id, stripe_subscription_id, created_at
            ) VALUES (
                'user-1', 'bad-sub@example.com', 'hash', 'Bad Sub', 0, 0, 0, 0, 'cus_123', 'cs_test_bad_123', CURRENT_TIMESTAMP
            )
            """
        )

    monkeypatch.setattr(db_module, "engine", legacy_engine)
    monkeypatch.setattr(db_module, "is_sqlite", True)

    db_module.create_schema()

    with legacy_engine.connect() as connection:
        subscription_id = connection.exec_driver_sql(
            "SELECT stripe_subscription_id FROM users WHERE id = 'user-1'"
        ).scalar_one()

    legacy_engine.dispose()

    assert subscription_id is None
