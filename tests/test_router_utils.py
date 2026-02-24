from __future__ import annotations

import pytest
from fastapi import HTTPException

from remodelator.infra.operation_lock import OperationLockTimeoutError
from remodelator.interfaces.api.errors import CriticalDependencyError
from remodelator.interfaces.api.router_utils import handle


def test_handle_maps_critical_value_error_to_503() -> None:
    with pytest.raises(HTTPException) as exc_info:
        handle(lambda: (_ for _ in ()).throw(CriticalDependencyError("dependency unavailable")))
    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "dependency unavailable"


def test_handle_maps_regular_value_error_to_400() -> None:
    with pytest.raises(HTTPException) as exc_info:
        handle(lambda: (_ for _ in ()).throw(ValueError("bad input")))
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "bad input"


def test_handle_maps_operation_lock_timeout_to_409() -> None:
    with pytest.raises(HTTPException) as exc_info:
        handle(lambda: (_ for _ in ()).throw(OperationLockTimeoutError("operation already running")))
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "operation already running"
