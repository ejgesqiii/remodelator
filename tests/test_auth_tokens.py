from __future__ import annotations

import time

import pytest

from remodelator.infra.auth_tokens import create_session_token, verify_session_token


def test_session_token_round_trip() -> None:
    token = create_session_token("user-1", "secret-key", ttl_seconds=600)
    assert verify_session_token(token, "secret-key") == "user-1"


def test_session_token_rejects_tampering() -> None:
    token = create_session_token("user-1", "secret-key", ttl_seconds=600)
    tampered = token[:-1] + ("a" if token[-1] != "a" else "b")
    with pytest.raises(ValueError, match="Invalid session token"):
        verify_session_token(tampered, "secret-key")


def test_session_token_expires() -> None:
    token = create_session_token("user-1", "secret-key", ttl_seconds=1)
    time.sleep(1.1)
    with pytest.raises(ValueError, match="expired"):
        verify_session_token(token, "secret-key")
