from __future__ import annotations

from fastapi.routing import APIRoute

from remodelator.interfaces.api.routes.billing import router as billing_router
from remodelator.interfaces.api.routes.estimate_line_items import router as estimate_line_items_router
from remodelator.interfaces.api.routes.estimates import router as estimates_router
from remodelator.interfaces.api.routes.estimates_base import router as estimates_base_router
from remodelator.interfaces.api.routes.llm import router as llm_router
from remodelator.interfaces.api.routes.proposals import router as proposals_router
from remodelator.interfaces.api.routes.proposals_billing_llm import router as proposals_billing_llm_router


def _pairs(router) -> set[tuple[str, str]]:
    api_routes = [route for route in router.routes if isinstance(route, APIRoute)]
    return {(method, route.path) for route in api_routes for method in (route.methods or set())}


def test_estimates_router_aggregates_base_and_line_item_routes() -> None:
    expected = _pairs(estimates_base_router) | _pairs(estimate_line_items_router)
    actual = _pairs(estimates_router)
    assert actual == expected


def test_proposals_billing_llm_router_aggregates_subdomain_routes() -> None:
    expected = _pairs(proposals_router) | _pairs(billing_router) | _pairs(llm_router)
    actual = _pairs(proposals_billing_llm_router)
    assert actual == expected
