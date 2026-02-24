from __future__ import annotations

from contextlib import contextmanager

from sqlalchemy import create_engine, event
from sqlalchemy.engine import make_url
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
