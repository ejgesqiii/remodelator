from __future__ import annotations

from fastapi import APIRouter

from remodelator.interfaces.api.routes.estimate_line_items import router as estimate_line_items_router
from remodelator.interfaces.api.routes.estimates_base import router as estimates_base_router

router = APIRouter()
router.include_router(estimates_base_router)
router.include_router(estimate_line_items_router)
