from __future__ import annotations

from fastapi import APIRouter

from remodelator.interfaces.api.routes.billing import router as billing_router
from remodelator.interfaces.api.routes.llm import router as llm_router
from remodelator.interfaces.api.routes.proposals import router as proposals_router

router = APIRouter()
router.include_router(proposals_router)
router.include_router(billing_router)
router.include_router(llm_router)
