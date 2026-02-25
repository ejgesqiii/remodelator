from __future__ import annotations

import os
import sys
from pathlib import Path

from fastapi.testclient import TestClient
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

os.environ.setdefault("REMODELATOR_DATA_DIR", str(ROOT / "data"))

from remodelator.interfaces.api.app_factory import create_api_app  # noqa: E402
from remodelator.interfaces.api.main import app as main_app  # noqa: E402


def _endpoint_pairs(app) -> set[tuple[str, str]]:
    api_routes = [route for route in app.routes if isinstance(route, APIRoute) and route.include_in_schema]
    return {(method, route.path) for route in api_routes for method in (route.methods or set())}


def test_create_api_app_mounts_static_and_web_shell() -> None:
    app = create_api_app()

    assert any(isinstance(route.app, StaticFiles) and route.path == "/app-static" for route in app.routes if hasattr(route, "app"))
    pairs = _endpoint_pairs(app)
    assert ("GET", "/health") in pairs
    assert ("POST", "/auth/register") in pairs


def test_main_app_matches_factory_endpoint_surface() -> None:
    factory_pairs = _endpoint_pairs(create_api_app())
    main_pairs = _endpoint_pairs(main_app)
    assert factory_pairs == main_pairs


def test_create_api_app_runs_db_init_on_startup(monkeypatch) -> None:
    calls: list[bool] = []

    def _mock_init_db() -> dict[str, str]:
        calls.append(True)
        return {"status": "ok", "timestamp": "test"}

    monkeypatch.setattr("remodelator.interfaces.api.app_factory.service.init_db", _mock_init_db)

    with TestClient(create_api_app()) as client:
        assert client.get("/health").status_code == 200

    assert len(calls) == 1
