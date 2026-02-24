from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padding = "=" * ((4 - len(raw) % 4) % 4)
    return base64.urlsafe_b64decode(raw + padding)


def create_session_token(user_id: str, secret: str, ttl_seconds: int) -> str:
    now = int(time.time())
    payload = {
        "uid": user_id,
        "iat": now,
        "exp": now + max(ttl_seconds, 1),
    }
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    signature = hmac.new(secret.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).digest()
    sig_b64 = _b64url_encode(signature)
    return f"{payload_b64}.{sig_b64}"


def verify_session_token(token: str, secret: str) -> str:
    try:
        payload_b64, sig_b64 = token.split(".", 1)
    except ValueError as exc:
        raise ValueError("Invalid session token.") from exc

    expected_signature = hmac.new(secret.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).digest()
    expected_sig_b64 = _b64url_encode(expected_signature)
    if not hmac.compare_digest(sig_b64, expected_sig_b64):
        raise ValueError("Invalid session token.")

    try:
        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
        user_id = str(payload["uid"])
        exp = int(payload["exp"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        raise ValueError("Invalid session token.") from exc

    if exp <= int(time.time()):
        raise ValueError("Session token expired.")

    return user_id
