from __future__ import annotations

import hashlib
import hmac
import secrets

from remodelator.config import get_settings
from remodelator.infra.auth_tokens import create_session_token
from remodelator.infra.auth_tokens import verify_session_token

PASSWORD_SCHEME = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 260_000
PASSWORD_SALT_BYTES = 16


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(PASSWORD_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return f"{PASSWORD_SCHEME}${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def is_legacy_sha256_hash(stored_hash: str) -> bool:
    return "$" not in stored_hash and len(stored_hash) == 64


def verify_password(stored_hash: str, password: str) -> bool:
    if is_legacy_sha256_hash(stored_hash):
        legacy_digest = hashlib.sha256(password.encode("utf-8")).hexdigest()
        return hmac.compare_digest(stored_hash, legacy_digest)

    try:
        scheme, iter_text, salt_hex, digest_hex = stored_hash.split("$", 3)
        if scheme != PASSWORD_SCHEME:
            return False
        iterations = int(iter_text)
        salt = bytes.fromhex(salt_hex)
        expected_digest = bytes.fromhex(digest_hex)
    except (ValueError, TypeError):
        return False

    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(candidate, expected_digest)


def normalize_password(password: str) -> str:
    trimmed = password.strip()
    if len(trimmed) < 8:
        raise ValueError("Password must be at least 8 characters.")
    if len(trimmed) > 128:
        raise ValueError("Password must be 128 characters or fewer.")
    return trimmed


def issue_session_token(user_id: str) -> str:
    settings = get_settings()
    if settings.app_env in {"production", "prod"} and settings.session_secret == "local-session-secret-change-me":
        raise ValueError("REMODELATOR_SESSION_SECRET must be set in production.")
    return create_session_token(
        user_id=user_id,
        secret=settings.session_secret,
        ttl_seconds=settings.session_ttl_seconds,
    )


def resolve_user_id_from_session_token(token: str) -> str:
    settings = get_settings()
    if settings.app_env in {"production", "prod"} and settings.session_secret == "local-session-secret-change-me":
        raise ValueError("REMODELATOR_SESSION_SECRET must be set in production.")
    return verify_session_token(token=token, secret=settings.session_secret)


def verify_admin_key(provided_key: str | None) -> None:
    settings = get_settings()
    if settings.app_env in {"production", "prod"} and settings.admin_api_key == "local-admin-key":
        raise ValueError("REMODELATOR_ADMIN_API_KEY must be set in production.")
    if not provided_key or not hmac.compare_digest(provided_key, settings.admin_api_key):
        raise ValueError("Invalid admin key.")


def role_for_email(email: str) -> str:
    settings = get_settings()
    email_clean = email.strip().lower()
    if email_clean and email_clean in settings.admin_user_emails:
        return "admin"
    return "user"
