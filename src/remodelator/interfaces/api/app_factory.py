from __future__ import annotations

import json
import logging
from contextlib import asynccontextmanager
from time import perf_counter
from typing import Any
from uuid import uuid4

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from remodelator.application import service
from remodelator.config import get_settings
from remodelator.infra.db import engine
from remodelator.infra.rate_limiter import RateLimitDecision
from remodelator.infra.rate_limiter import SlidingWindowRateLimiter
from remodelator.interfaces.api.routes import activity_backup_router
from remodelator.interfaces.api.routes import admin_router
from remodelator.interfaces.api.routes import auth_profile_router
from remodelator.interfaces.api.routes import catalog_templates_router
from remodelator.interfaces.api.routes import estimates_router
from remodelator.interfaces.api.routes import proposals_billing_llm_router
from remodelator.interfaces.api.routes import system_router
from remodelator.interfaces.web.router import TEMPLATES_DIR
from remodelator.interfaces.web.router import router as web_router

logger = logging.getLogger("remodelator.api")


def _security_headers(response: Response) -> None:
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")


def _request_id_from_headers(request: Request) -> str:
    incoming = request.headers.get("x-request-id", "").strip()
    if incoming and len(incoming) <= 128:
        return incoming
    return str(uuid4())


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "").strip()
    if forwarded:
        return forwarded.split(",")[0].strip() or "unknown"
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _is_exempt_from_rate_limit(path: str) -> bool:
    return (
        path.startswith("/docs")
        or path.startswith("/redoc")
        or path.startswith("/openapi")
        or path.startswith("/app")
        or path.startswith("/app-static")
        or path.startswith("/health")
    )


def _rate_limit_key(
    request: Request,
    *,
    public_max: int,
    authenticated_max: int,
) -> tuple[str, int]:
    has_auth_header = bool(request.headers.get("x-session-token") or request.headers.get("x-admin-key"))
    if has_auth_header:
        return (f"auth:{_client_ip(request)}", authenticated_max)
    return (f"public:{_client_ip(request)}", public_max)


def _attach_rate_limit_headers(response: Response, decision: RateLimitDecision) -> None:
    response.headers.setdefault("X-RateLimit-Limit", str(decision.limit))
    response.headers.setdefault("X-RateLimit-Remaining", str(decision.remaining))
    if not decision.allowed and decision.retry_after_seconds > 0:
        response.headers.setdefault("Retry-After", str(decision.retry_after_seconds))


def _log_request_event(
    *,
    request_id: str,
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    client_ip: str,
    blocked_by_rate_limit: bool,
) -> None:
    logger.info(
        json.dumps(
            {
                "event": "http_request",
                "request_id": request_id,
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": round(duration_ms, 2),
                "client_ip": client_ip,
                "rate_limited": blocked_by_rate_limit,
            },
            separators=(",", ":"),
        )
    )


def _error_code_for_status(status_code: int) -> str:
    mapping = {
        400: "bad_request",
        401: "auth_error",
        403: "forbidden",
        404: "not_found",
        409: "conflict",
        422: "validation_error",
        429: "rate_limited",
        503: "dependency_unavailable",
    }
    return mapping.get(status_code, "internal_error")


def _message_from_error_detail(detail: Any, default: str) -> str:
    if isinstance(detail, str) and detail.strip():
        return detail
    if isinstance(detail, dict):
        message = detail.get("message")
        if isinstance(message, str) and message.strip():
            return message
    return default


def _error_payload(
    *,
    status_code: int,
    detail: Any,
    request_id: str,
    fallback_message: str,
) -> dict[str, Any]:
    message = _message_from_error_detail(detail, fallback_message)
    return {
        "detail": detail,
        "error": {
            "code": _error_code_for_status(status_code),
            "message": message,
            "status": status_code,
        },
        "request_id": request_id,
    }


def create_api_app() -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def _lifespan(app: FastAPI):  # type: ignore[unused-argument]
        try:
            service.init_db()
        except Exception:
            logger.exception("Failed to initialize database schema during startup")
            raise
        try:
            yield
        finally:
            try:
                engine.dispose()
            except Exception:
                logger.exception("Failed to dispose database engine during shutdown")

    app = FastAPI(title="Remodelator vNext API", version="0.1.0", lifespan=_lifespan)
    limiter = (
        SlidingWindowRateLimiter(settings.api_rate_limit_window_seconds)
        if settings.api_rate_limit_enabled
        else None
    )

    if settings.cors_allowed_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=list(settings.cors_allowed_origins),
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        request_id = getattr(request.state, "request_id", str(uuid4()))
        payload = _error_payload(
            status_code=exc.status_code,
            detail=exc.detail,
            request_id=request_id,
            fallback_message="Request failed.",
        )
        response = JSONResponse(status_code=exc.status_code, content=payload)
        response.headers["X-Request-ID"] = request_id
        _security_headers(response)
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", str(uuid4()))
        payload = _error_payload(
            status_code=422,
            detail=exc.errors(),
            request_id=request_id,
            fallback_message="Validation failed.",
        )
        response = JSONResponse(status_code=422, content=payload)
        response.headers["X-Request-ID"] = request_id
        _security_headers(response)
        return response

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", str(uuid4()))
        logger.exception("Unhandled exception", extra={"request_id": request_id})
        payload = _error_payload(
            status_code=500,
            detail="Internal server error.",
            request_id=request_id,
            fallback_message="Internal server error.",
        )
        response = JSONResponse(status_code=500, content=payload)
        response.headers["X-Request-ID"] = request_id
        _security_headers(response)
        return response

    @app.middleware("http")
    async def apply_request_policies(request: Request, call_next) -> Response:  # type: ignore[override]
        request_id = _request_id_from_headers(request)
        request.state.request_id = request_id
        start = perf_counter()
        client_ip = _client_ip(request)
        limit_decision: RateLimitDecision | None = None

        if limiter is not None and not _is_exempt_from_rate_limit(request.url.path):
            rate_key, bucket_limit = _rate_limit_key(
                request,
                public_max=settings.api_rate_limit_public_max,
                authenticated_max=settings.api_rate_limit_authenticated_max,
            )
            limit_decision = limiter.check(rate_key, bucket_limit)
            if not limit_decision.allowed:
                payload = _error_payload(
                    status_code=429,
                    detail="Rate limit exceeded. Retry after the advertised delay.",
                    request_id=request_id,
                    fallback_message="Rate limit exceeded. Retry after the advertised delay.",
                )
                response = JSONResponse(status_code=429, content=payload)
                response.headers["X-Request-ID"] = request_id
                _attach_rate_limit_headers(response, limit_decision)
                _security_headers(response)
                _log_request_event(
                    request_id=request_id,
                    method=request.method,
                    path=request.url.path,
                    status_code=429,
                    duration_ms=(perf_counter() - start) * 1000,
                    client_ip=client_ip,
                    blocked_by_rate_limit=True,
                )
                return response

        response = await call_next(request)

        response.headers.setdefault("X-Request-ID", request_id)
        if limit_decision is not None:
            _attach_rate_limit_headers(response, limit_decision)
        _security_headers(response)
        _log_request_event(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=(perf_counter() - start) * 1000,
            client_ip=client_ip,
            blocked_by_rate_limit=False,
        )
        return response

    app.mount(
        "/app-static",
        StaticFiles(directory=str(TEMPLATES_DIR.parent / "static")),
        name="app-static",
    )
    app.include_router(web_router)
    app.include_router(system_router)
    app.include_router(auth_profile_router)
    app.include_router(estimates_router)
    app.include_router(catalog_templates_router)
    app.include_router(proposals_billing_llm_router)
    app.include_router(activity_backup_router)
    app.include_router(admin_router)
    return app
