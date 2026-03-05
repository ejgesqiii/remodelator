from __future__ import annotations

import os
import re
import sys
from pathlib import Path

from fastapi.routing import APIRoute

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

os.environ.setdefault("REMODELATOR_DATA_DIR", str(ROOT / "data"))

from remodelator.interfaces.api.main import app  # noqa: E402


def _normalize_path(path: str) -> str:
    # UI template paths use various variable names; normalize all path params.
    return re.sub(r"\{[^}]+\}", "{param}", path)


def test_web_api_endpoints_are_backed_by_registered_routes() -> None:
    api_routes = [
        route for route in app.routes if isinstance(route, APIRoute) and route.include_in_schema
    ]
    backend_pairs = {
        (method, _normalize_path(route.path))
        for route in api_routes
        for method in (route.methods or set())
    }

    # Canonical frontend API surface used by apps/web/src/api/*.ts
    web_pairs = {
        ("GET", "/activity"),
        ("GET", "/admin/activity"),
        ("POST", "/admin/audit-prune"),
        ("GET", "/admin/billing-ledger"),
        ("POST", "/admin/demo-reset"),
        ("GET", "/admin/summary"),
        ("GET", "/admin/users"),
        ("GET", "/audit"),
        ("POST", "/auth/login"),
        ("POST", "/auth/password-reset/confirm"),
        ("POST", "/auth/password-reset/request"),
        ("POST", "/auth/register"),
        ("GET", "/backup/export"),
        ("POST", "/backup/restore"),
        ("GET", "/billing/ledger"),
        ("GET", "/billing/policy"),
        ("GET", "/billing/provider-status"),
        ("POST", "/billing/simulate-estimate-charge"),
        ("POST", "/billing/simulate-event"),
        ("POST", "/billing/simulate-refund"),
        ("POST", "/billing/simulate-subscription"),
        ("GET", "/billing/subscription-state"),
        ("POST", "/catalog/import"),
        ("GET", "/catalog/search"),
        ("GET", "/catalog/tree"),
        ("POST", "/catalog/upsert"),
        ("GET", "/estimates"),
        ("POST", "/estimates"),
        ("DELETE", "/estimates/{param}"),
        ("GET", "/estimates/{param}"),
        ("PUT", "/estimates/{param}"),
        ("POST", "/estimates/{param}/duplicate"),
        ("POST", "/estimates/{param}/export"),
        ("POST", "/estimates/{param}/line-items"),
        ("POST", "/estimates/{param}/line-items/group"),
        ("DELETE", "/estimates/{param}/line-items/{param}"),
        ("PUT", "/estimates/{param}/line-items/{param}"),
        ("POST", "/estimates/{param}/line-items/{param}/reorder"),
        ("POST", "/estimates/{param}/quickstart"),
        ("POST", "/estimates/{param}/recalc"),
        ("POST", "/estimates/{param}/status"),
        ("POST", "/estimates/{param}/unlock"),
        ("POST", "/estimates/{param}/version"),
        ("POST", "/pricing/llm/apply"),
        ("POST", "/pricing/llm/live"),
        ("GET", "/pricing/llm/status"),
        ("GET", "/profile"),
        ("POST", "/proposals/{param}/pdf"),
        ("GET", "/proposals/{param}/pdf/download"),
        ("GET", "/proposals/public/{param}/pdf"),
        ("GET", "/proposals/public/{param}/render"),
        ("GET", "/proposals/{param}/render"),
        ("POST", "/proposals/{param}/share"),
        ("GET", "/templates"),
        ("POST", "/templates/apply"),
        ("POST", "/templates/save"),
        ("PUT", "/profile"),
    }

    missing = sorted(web_pairs - backend_pairs)
    assert not missing, f"Frontend API endpoints missing in backend routes: {missing}"

