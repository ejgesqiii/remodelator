from __future__ import annotations

import os
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env_csv(name: str, default: str = "", lowercase: bool = True) -> tuple[str, ...]:
    raw = os.getenv(name, default)
    values = [chunk.strip() for chunk in raw.split(",") if chunk.strip()]
    if lowercase:
        values = [value.lower() for value in values]
    return tuple(values)


def _env_choice(name: str, default: str, allowed: set[str]) -> str:
    raw = os.getenv(name, default).strip().upper()
    if raw in allowed:
        return raw
    return default


def _env_decimal(name: str, default: str) -> Decimal:
    try:
        return Decimal(os.getenv(name, default).strip())
    except Exception:
        return Decimal(default)


def _env_int(name: str, default: int, minimum: int = 0) -> int:
    try:
        value = int(os.getenv(name, str(default)).strip())
    except Exception:
        value = default
    return max(minimum, value)


def _env_float(name: str, default: float, minimum: float = 0.0) -> float:
    try:
        value = float(os.getenv(name, str(default)).strip())
    except Exception:
        value = default
    if value < minimum:
        return minimum
    return value


@dataclass(frozen=True)
class Settings:
    app_env: str
    data_dir: Path
    db_url: str
    session_file: Path
    session_secret: str
    session_ttl_seconds: int
    allow_legacy_user_header: bool
    sqlite_journal_mode: str
    sqlite_synchronous: str
    sqlite_busy_timeout_ms: int
    operation_lock_timeout_seconds: float
    openrouter_api_key: str | None
    openrouter_model: str
    openrouter_timeout_seconds: float
    openrouter_max_retries: int
    openrouter_retry_backoff_seconds: float
    llm_price_change_max_pct: Decimal
    billing_annual_subscription_amount: Decimal
    billing_realtime_pricing_amount: Decimal
    billing_currency: str
    billing_provider: str
    stripe_secret_key: str | None
    stripe_webhook_secret: str | None
    api_limit_max: int
    api_rate_limit_enabled: bool
    api_rate_limit_window_seconds: int
    api_rate_limit_public_max: int
    api_rate_limit_authenticated_max: int
    audit_retention_days: int
    admin_api_key: str
    admin_user_emails: tuple[str, ...]
    cors_allowed_origins: tuple[str, ...]


def get_settings() -> Settings:
    project_root = Path(__file__).resolve().parents[2]
    app_env = os.getenv("REMODELATOR_ENV", "local").strip().lower()
    data_dir = Path(os.getenv("REMODELATOR_DATA_DIR", project_root / "data"))
    data_dir.mkdir(parents=True, exist_ok=True)

    default_db = f"sqlite:///{data_dir / 'remodelator.db'}"
    db_url = os.getenv("REMODELATOR_DB_URL", default_db)
    session_file = data_dir / "session.json"
    session_secret = os.getenv("REMODELATOR_SESSION_SECRET", "local-session-secret-change-me")
    session_ttl_seconds = int(os.getenv("REMODELATOR_SESSION_TTL_SECONDS", "43200"))
    allow_legacy_user_header = _env_bool(
        "REMODELATOR_ALLOW_LEGACY_USER_HEADER",
        False,
    )
    sqlite_journal_mode = _env_choice("REMODELATOR_SQLITE_JOURNAL_MODE", "WAL", {"WAL", "DELETE", "TRUNCATE", "PERSIST", "MEMORY", "OFF"})
    sqlite_synchronous = _env_choice("REMODELATOR_SQLITE_SYNCHRONOUS", "NORMAL", {"OFF", "NORMAL", "FULL", "EXTRA"})
    sqlite_busy_timeout_ms = max(0, int(os.getenv("REMODELATOR_SQLITE_BUSY_TIMEOUT_MS", "5000")))
    operation_lock_timeout_seconds = _env_float("REMODELATOR_OPERATION_LOCK_TIMEOUT_SECONDS", 10.0, minimum=0.1)
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    openrouter_model = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")
    openrouter_timeout_seconds = float(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "30"))
    openrouter_max_retries = int(os.getenv("OPENROUTER_MAX_RETRIES", "2"))
    openrouter_retry_backoff_seconds = float(os.getenv("OPENROUTER_RETRY_BACKOFF_SECONDS", "0.6"))
    llm_price_change_max_pct = Decimal(os.getenv("REMODELATOR_LLM_PRICE_CHANGE_MAX_PCT", "20"))
    billing_annual_subscription_amount = _env_decimal("REMODELATOR_BILLING_ANNUAL_SUBSCRIPTION_AMOUNT", "1200.00")
    billing_realtime_pricing_amount = _env_decimal("REMODELATOR_BILLING_REALTIME_PRICING_AMOUNT", "10.00")
    billing_currency = os.getenv("REMODELATOR_BILLING_CURRENCY", "USD").strip().upper() or "USD"
    billing_provider = os.getenv("REMODELATOR_BILLING_PROVIDER", "simulation").strip().lower()
    if billing_provider not in {"simulation", "stripe"}:
        billing_provider = "simulation"
    stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
    stripe_webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    api_limit_max = _env_int("REMODELATOR_API_LIMIT_MAX", 500, minimum=1)
    api_rate_limit_enabled = _env_bool("REMODELATOR_API_RATE_LIMIT_ENABLED", True)
    api_rate_limit_window_seconds = _env_int("REMODELATOR_API_RATE_LIMIT_WINDOW_SECONDS", 60, minimum=1)
    api_rate_limit_public_max = _env_int("REMODELATOR_API_RATE_LIMIT_PUBLIC_MAX", 120, minimum=1)
    api_rate_limit_authenticated_max = _env_int("REMODELATOR_API_RATE_LIMIT_AUTHENTICATED_MAX", 240, minimum=1)
    audit_retention_days = _env_int("REMODELATOR_AUDIT_RETENTION_DAYS", 365, minimum=1)
    admin_api_key = os.getenv("REMODELATOR_ADMIN_API_KEY", "local-admin-key")
    admin_user_emails = _env_csv("REMODELATOR_ADMIN_USER_EMAILS", "")
    cors_allowed_origins = _env_csv(
        "REMODELATOR_CORS_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173",
        lowercase=False,
    )

    return Settings(
        app_env=app_env,
        data_dir=data_dir,
        db_url=db_url,
        session_file=session_file,
        session_secret=session_secret,
        session_ttl_seconds=session_ttl_seconds,
        allow_legacy_user_header=allow_legacy_user_header,
        sqlite_journal_mode=sqlite_journal_mode,
        sqlite_synchronous=sqlite_synchronous,
        sqlite_busy_timeout_ms=sqlite_busy_timeout_ms,
        operation_lock_timeout_seconds=operation_lock_timeout_seconds,
        openrouter_api_key=openrouter_api_key,
        openrouter_model=openrouter_model,
        openrouter_timeout_seconds=openrouter_timeout_seconds,
        openrouter_max_retries=openrouter_max_retries,
        openrouter_retry_backoff_seconds=openrouter_retry_backoff_seconds,
        llm_price_change_max_pct=llm_price_change_max_pct,
        billing_annual_subscription_amount=billing_annual_subscription_amount,
        billing_realtime_pricing_amount=billing_realtime_pricing_amount,
        billing_currency=billing_currency,
        billing_provider=billing_provider,
        stripe_secret_key=stripe_secret_key,
        stripe_webhook_secret=stripe_webhook_secret,
        api_limit_max=api_limit_max,
        api_rate_limit_enabled=api_rate_limit_enabled,
        api_rate_limit_window_seconds=api_rate_limit_window_seconds,
        api_rate_limit_public_max=api_rate_limit_public_max,
        api_rate_limit_authenticated_max=api_rate_limit_authenticated_max,
        audit_retention_days=audit_retention_days,
        admin_api_key=admin_api_key,
        admin_user_emails=admin_user_emails,
        cors_allowed_origins=cors_allowed_origins,
    )
