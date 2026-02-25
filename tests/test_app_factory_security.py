from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

import remodelator.interfaces.api.app_factory as app_factory
from remodelator.interfaces.api.app_factory import create_api_app


def _set_test_data_dir(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setenv("REMODELATOR_DATA_DIR", str(tmp_path / "data"))


def test_security_headers_are_added(monkeypatch, tmp_path: Path) -> None:
    _set_test_data_dir(monkeypatch, tmp_path)
    monkeypatch.setenv("REMODELATOR_CORS_ORIGINS", "http://localhost:5173")

    client = TestClient(create_api_app())
    response = client.get("/health")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert response.headers["permissions-policy"] == "geolocation=(), microphone=(), camera=()"


def test_cors_allows_configured_origin(monkeypatch, tmp_path: Path) -> None:
    _set_test_data_dir(monkeypatch, tmp_path)
    monkeypatch.setenv("REMODELATOR_CORS_ORIGINS", "http://localhost:5173")

    client = TestClient(create_api_app())
    preflight = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert preflight.status_code == 200
    assert preflight.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_headers_not_added_when_origins_empty(monkeypatch, tmp_path: Path) -> None:
    _set_test_data_dir(monkeypatch, tmp_path)
    monkeypatch.setenv("REMODELATOR_CORS_ORIGINS", "")

    client = TestClient(create_api_app())
    response = client.get("/health", headers={"Origin": "http://localhost:5173"})

    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


def test_request_id_header_is_attached_and_respects_client_value(monkeypatch, tmp_path: Path) -> None:
    _set_test_data_dir(monkeypatch, tmp_path)
    monkeypatch.setenv("REMODELATOR_CORS_ORIGINS", "")

    client = TestClient(create_api_app())
    generated = client.get("/pricing/llm/status")
    assert generated.status_code == 200
    assert generated.headers.get("x-request-id")

    echoed = client.get("/pricing/llm/status", headers={"x-request-id": "client-trace-id-123"})
    assert echoed.status_code == 200
    assert echoed.headers.get("x-request-id") == "client-trace-id-123"


def test_rate_limit_blocks_public_requests(monkeypatch, tmp_path: Path) -> None:
    _set_test_data_dir(monkeypatch, tmp_path)
    monkeypatch.setenv("REMODELATOR_API_RATE_LIMIT_ENABLED", "true")
    monkeypatch.setenv("REMODELATOR_API_RATE_LIMIT_WINDOW_SECONDS", "60")
    monkeypatch.setenv("REMODELATOR_API_RATE_LIMIT_PUBLIC_MAX", "1")
    monkeypatch.setenv("REMODELATOR_API_RATE_LIMIT_AUTHENTICATED_MAX", "5")

    client = TestClient(create_api_app())
    first = client.get("/pricing/llm/status")
    second = client.get("/pricing/llm/status")

    assert first.status_code == 200
    assert first.headers.get("x-ratelimit-limit") == "1"
    assert first.headers.get("x-ratelimit-remaining") == "0"

    assert second.status_code == 429
    assert second.json()["detail"].startswith("Rate limit exceeded")
    assert second.json()["error"]["code"] == "rate_limited"
    assert second.json()["error"]["status"] == 429
    assert second.json()["request_id"]
    assert second.headers.get("x-ratelimit-limit") == "1"
    assert second.headers.get("x-ratelimit-remaining") == "0"
    assert second.headers.get("retry-after")
    assert second.headers.get("x-request-id")


def test_validation_error_envelope_is_consistent(monkeypatch, tmp_path: Path) -> None:
    _set_test_data_dir(monkeypatch, tmp_path)
    monkeypatch.setenv("REMODELATOR_CORS_ORIGINS", "")

    client = TestClient(create_api_app())
    response = client.post(
        "/auth/register",
        json={"email": "bad@example.com", "password": "short", "full_name": "Bad Password"},
    )
    payload = response.json()
    assert response.status_code == 422
    assert isinstance(payload.get("detail"), list)
    assert payload["error"]["code"] == "validation_error"
    assert payload["error"]["status"] == 422
    assert payload["request_id"] == response.headers.get("x-request-id")


def test_rate_limit_uses_authenticated_bucket_when_auth_header_present(monkeypatch, tmp_path: Path) -> None:
    _set_test_data_dir(monkeypatch, tmp_path)
    monkeypatch.setenv("REMODELATOR_API_RATE_LIMIT_ENABLED", "true")
    monkeypatch.setenv("REMODELATOR_API_RATE_LIMIT_WINDOW_SECONDS", "60")
    monkeypatch.setenv("REMODELATOR_API_RATE_LIMIT_PUBLIC_MAX", "10")
    monkeypatch.setenv("REMODELATOR_API_RATE_LIMIT_AUTHENTICATED_MAX", "1")

    client = TestClient(create_api_app())
    headers = {"x-session-token": "synthetic-token"}
    first = client.get("/pricing/llm/status", headers=headers)
    second = client.get("/pricing/llm/status", headers=headers)

    assert first.status_code == 200
    assert first.headers.get("x-ratelimit-limit") == "1"
    assert first.headers.get("x-ratelimit-remaining") == "0"

    assert second.status_code == 429
    assert second.headers.get("x-ratelimit-limit") == "1"


def test_app_shutdown_disposes_engine(monkeypatch, tmp_path: Path) -> None:
    _set_test_data_dir(monkeypatch, tmp_path)
    dispose_calls = {"count": 0}

    def _dispose() -> None:
        dispose_calls["count"] += 1

    monkeypatch.setattr(app_factory.engine, "dispose", _dispose)

    with TestClient(create_api_app()) as client:
        response = client.get("/health")
        assert response.status_code == 200

    assert dispose_calls["count"] == 1


def test_unhandled_error_includes_traceback_by_default_in_local(monkeypatch, tmp_path: Path) -> None:
    _set_test_data_dir(monkeypatch, tmp_path)
    monkeypatch.delenv("REMODELATOR_API_INCLUDE_TRACEBACK", raising=False)
    monkeypatch.setenv("REMODELATOR_ENV", "local")

    app = create_api_app()

    @app.get("/_boom-local")
    def _boom_local() -> dict[str, str]:
        raise RuntimeError("boom-local")

    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get("/_boom-local")
    payload = response.json()

    assert response.status_code == 500
    assert payload["error"]["code"] == "internal_error"
    assert payload["error"]["exception_type"] == "RuntimeError"
    assert "boom-local" in payload["error"]["traceback"]


def test_unhandled_error_omits_traceback_in_production(monkeypatch, tmp_path: Path) -> None:
    _set_test_data_dir(monkeypatch, tmp_path)
    monkeypatch.delenv("REMODELATOR_API_INCLUDE_TRACEBACK", raising=False)
    monkeypatch.setenv("REMODELATOR_ENV", "production")

    app = create_api_app()

    @app.get("/_boom-prod")
    def _boom_prod() -> dict[str, str]:
        raise RuntimeError("boom-prod")

    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get("/_boom-prod")
    payload = response.json()

    assert response.status_code == 500
    assert payload["error"]["code"] == "internal_error"
    assert "exception_type" not in payload["error"]
    assert "traceback" not in payload["error"]
