from __future__ import annotations

import os
import sys
from pathlib import Path

from fastapi.routing import APIRoute

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

os.environ.setdefault("REMODELATOR_DATA_DIR", str(ROOT / "data"))

from remodelator.interfaces.api.main import app  # noqa: E402


def test_api_routes_registered_and_visible() -> None:
    api_routes = [
        route for route in app.routes if isinstance(route, APIRoute) and route.include_in_schema
    ]
    pairs = {(method, route.path) for route in api_routes for method in (route.methods or set())}

    assert ("GET", "/health") in pairs
    assert ("POST", "/auth/register") in pairs
    assert ("POST", "/estimates/{estimate_id}/line-items/{line_item_id}/reorder") in pairs
    assert ("POST", "/estimates/{estimate_id}/quickstart") in pairs
    assert ("POST", "/pricing/llm/live") in pairs
    assert ("POST", "/admin/demo-reset") in pairs
    assert ("POST", "/admin/audit-prune") in pairs
    assert ("GET", "/billing/policy") in pairs
    assert ("GET", "/billing/provider-status") in pairs
    assert ("GET", "/billing/subscription-state") in pairs
    assert ("POST", "/billing/simulate-event") in pairs

    # Keep endpoint surface stable as routers are split/refactored.
    assert len(pairs) == 55


def test_llm_alias_route_is_deprecated() -> None:
    api_routes = [
        route for route in app.routes if isinstance(route, APIRoute) and route.include_in_schema
    ]
    simulate = next(
        route for route in api_routes if route.path == "/pricing/llm/simulate" and "POST" in (route.methods or set())
    )
    live = next(
        route for route in api_routes if route.path == "/pricing/llm/live" and "POST" in (route.methods or set())
    )

    assert simulate.deprecated is True
    assert live.deprecated is not True
