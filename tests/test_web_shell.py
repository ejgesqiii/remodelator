from __future__ import annotations

import os
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault("REMODELATOR_DATA_DIR", str(ROOT / "data" / "test_web"))

from remodelator.interfaces.api.main import app  # noqa: E402


client = TestClient(app)


def test_web_shell_serves() -> None:
    response = client.get("/app")
    assert response.status_code == 200
    assert "Remodelator vNext" in response.text


def test_web_static_serves() -> None:
    response = client.get("/app-static/app.css")
    assert response.status_code == 200
    assert "--primary" in response.text
