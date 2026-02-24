from __future__ import annotations

from typing import Any, Callable

from fastapi import HTTPException

from remodelator.config import get_settings
from remodelator.infra.operation_lock import OperationLockTimeoutError
from remodelator.interfaces.api.errors import CriticalDependencyError


def handle(fn: Callable[[], Any]) -> Any:
    try:
        return fn()
    except CriticalDependencyError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except OperationLockTimeoutError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def reject_in_production(operation: str) -> None:
    settings = get_settings()
    if settings.app_env in {"production", "prod"}:
        raise HTTPException(status_code=403, detail=f"{operation} is disabled in production.")
