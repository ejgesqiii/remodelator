from __future__ import annotations

import os
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

try:
    import fcntl
except Exception:  # pragma: no cover - Windows fallback path
    fcntl = None  # type: ignore[assignment]

try:
    import msvcrt
except Exception:  # pragma: no cover - POSIX path
    msvcrt = None  # type: ignore[assignment]


class OperationLockTimeoutError(RuntimeError):
    """Raised when an operation lock cannot be acquired within timeout."""


def _lock_path(data_dir: Path, lock_name: str) -> Path:
    safe_name = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "_" for ch in lock_name.strip().lower())
    if not safe_name:
        raise ValueError("lock_name must contain at least one valid character.")
    return data_dir / f".lock.{safe_name}"


def _acquire_non_blocking(handle) -> bool:  # type: ignore[no-untyped-def]
    if fcntl is not None:
        try:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            return True
        except BlockingIOError:
            return False

    if msvcrt is not None:  # pragma: no cover - Windows fallback path
        try:
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            return True
        except OSError:
            return False

    return True


def _release_lock(handle) -> None:  # type: ignore[no-untyped-def]
    if fcntl is not None:
        fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
        return
    if msvcrt is not None:  # pragma: no cover - Windows fallback path
        msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)


@contextmanager
def operation_lock(lock_name: str, data_dir: Path, timeout_seconds: float) -> None:
    if timeout_seconds <= 0:
        raise ValueError("timeout_seconds must be > 0.")

    lock_file = _lock_path(data_dir, lock_name)
    lock_file.parent.mkdir(parents=True, exist_ok=True)
    deadline = time.monotonic() + timeout_seconds

    with lock_file.open("a+b") as handle:
        while True:
            if _acquire_non_blocking(handle):
                break
            if time.monotonic() >= deadline:
                raise OperationLockTimeoutError(
                    f"Operation '{lock_name}' is already in progress; retry shortly."
                )
            time.sleep(0.05)

        handle.seek(0)
        handle.truncate(0)
        metadata = f"pid={os.getpid()} acquired_at={datetime.now(timezone.utc).isoformat()}\n"
        handle.write(metadata.encode("utf-8"))
        handle.flush()

        try:
            yield
        finally:
            _release_lock(handle)
