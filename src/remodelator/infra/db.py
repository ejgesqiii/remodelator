from __future__ import annotations

from contextlib import contextmanager
from typing import Iterable

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Connection, make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from remodelator.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()
db_url = make_url(settings.db_url)
is_sqlite = db_url.get_backend_name() == "sqlite"

engine_kwargs: dict[str, object] = {"future": True, "pool_pre_ping": True}
if is_sqlite:
    # SQLite is used for local/demo development and tests; disable same-thread guard
    # for app server + test client access patterns.
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.db_url, **engine_kwargs)

if is_sqlite:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(dbapi_connection, connection_record) -> None:  # type: ignore[no-untyped-def]
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute(f"PRAGMA journal_mode={settings.sqlite_journal_mode}")
            cursor.execute(f"PRAGMA synchronous={settings.sqlite_synchronous}")
            cursor.execute(f"PRAGMA busy_timeout={settings.sqlite_busy_timeout_ms}")
        finally:
            cursor.close()

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


@contextmanager
def session_scope() -> Session:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def create_schema() -> None:
    # Import models so metadata is populated before create_all.
    from remodelator.infra import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _run_sqlite_schema_migrations()


SQLITE_SCHEMA_VERSION = 2


def _sqlite_table_columns(connection: Connection, table_name: str) -> set[str]:
    rows = connection.exec_driver_sql(f"PRAGMA table_info({table_name})").all()
    return {str(row[1]) for row in rows}


def _sqlite_index_names(connection: Connection, table_name: str) -> set[str]:
    rows = connection.exec_driver_sql(f"PRAGMA index_list({table_name})").all()
    return {str(row[1]) for row in rows}


def _ensure_sqlite_columns(connection: Connection, table_name: str, specs: Iterable[tuple[str, str]]) -> None:
    existing_columns = _sqlite_table_columns(connection, table_name)
    for column_name, column_sql in specs:
        if column_name in existing_columns:
            continue
        connection.exec_driver_sql(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_sql}")
        existing_columns.add(column_name)


def _ensure_sqlite_indexes(connection: Connection, table_name: str, specs: Iterable[tuple[str, str]]) -> None:
    existing_indexes = _sqlite_index_names(connection, table_name)
    for index_name, index_sql in specs:
        if index_name in existing_indexes:
            continue
        connection.exec_driver_sql(index_sql)
        existing_indexes.add(index_name)


def _dedupe_users_by_stripe_column(connection: Connection, column_name: str) -> None:
    if column_name not in {"stripe_customer_id", "stripe_subscription_id"}:
        return

    rows = connection.exec_driver_sql(
        f"""
        SELECT {column_name}, MIN(id) AS keep_id
        FROM users
        WHERE {column_name} IS NOT NULL AND TRIM({column_name}) != ''
        GROUP BY {column_name}
        HAVING COUNT(*) > 1
        """
    ).all()

    for value, keep_id in rows:
        if column_name == "stripe_customer_id":
            connection.exec_driver_sql(
                """
                UPDATE users
                SET stripe_customer_id = NULL,
                    stripe_subscription_id = NULL
                WHERE stripe_customer_id = ? AND id != ?
                """,
                (value, keep_id),
            )
        else:
            connection.exec_driver_sql(
                """
                UPDATE users
                SET stripe_subscription_id = NULL
                WHERE stripe_subscription_id = ? AND id != ?
                """,
                (value, keep_id),
            )


def _run_sqlite_schema_migrations() -> None:
    if not is_sqlite:
        return

    with engine.begin() as connection:
        current_version = int(connection.exec_driver_sql("PRAGMA user_version").scalar() or 0)

        # Backfill Stripe user linkage columns for existing SQLite databases.
        _ensure_sqlite_columns(
            connection,
            "users",
            (
                ("stripe_customer_id", "VARCHAR(255)"),
                ("stripe_subscription_id", "VARCHAR(255)"),
            ),
        )

        _dedupe_users_by_stripe_column(connection, "stripe_customer_id")
        _dedupe_users_by_stripe_column(connection, "stripe_subscription_id")

        # Align indexes with current ORM metadata for Stripe fields.
        _ensure_sqlite_indexes(
            connection,
            "users",
            (
                (
                    "ix_users_stripe_customer_id",
                    "CREATE UNIQUE INDEX ix_users_stripe_customer_id ON users (stripe_customer_id)",
                ),
                (
                    "ix_users_stripe_subscription_id",
                    "CREATE UNIQUE INDEX ix_users_stripe_subscription_id ON users (stripe_subscription_id)",
                ),
            ),
        )

        # Add compound indexes for frequent billing and idempotency lookups.
        _ensure_sqlite_indexes(
            connection,
            "billing_events",
            (
                (
                    "ix_billing_events_user_created_at",
                    "CREATE INDEX ix_billing_events_user_created_at ON billing_events (user_id, created_at DESC)",
                ),
                (
                    "ix_billing_events_user_event_created_at",
                    "CREATE INDEX ix_billing_events_user_event_created_at ON billing_events (user_id, event_type, created_at DESC)",
                ),
            ),
        )
        _ensure_sqlite_indexes(
            connection,
            "idempotency_records",
            (
                (
                    "ix_idempotency_records_scope_user_key",
                    "CREATE INDEX ix_idempotency_records_scope_user_key ON idempotency_records (scope, user_id, key)",
                ),
            ),
        )

        if current_version < SQLITE_SCHEMA_VERSION:
            connection.exec_driver_sql(f"PRAGMA user_version={SQLITE_SCHEMA_VERSION}")
