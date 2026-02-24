from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

import pytest

from remodelator.infra.operation_lock import OperationLockTimeoutError
from remodelator.infra.operation_lock import operation_lock

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"


def test_operation_lock_can_be_reacquired_after_release(tmp_path: Path) -> None:
    with operation_lock("demo-reset", tmp_path, timeout_seconds=0.5):
        pass

    with operation_lock("demo-reset", tmp_path, timeout_seconds=0.5):
        pass


def test_operation_lock_times_out_when_held_by_another_process(tmp_path: Path) -> None:
    ready_marker = tmp_path / "lock-ready.flag"
    env = os.environ.copy()
    env["PYTHONPATH"] = str(SRC)

    script = (
        "from pathlib import Path\n"
        "import time\n"
        "from remodelator.infra.operation_lock import operation_lock\n"
        f"base = Path(r'{tmp_path}')\n"
        f"ready = Path(r'{ready_marker}')\n"
        "with operation_lock('demo-reset', base, timeout_seconds=1.0):\n"
        "    ready.write_text('ready', encoding='utf-8')\n"
        "    time.sleep(0.8)\n"
    )
    proc = subprocess.Popen([sys.executable, "-c", script], cwd=ROOT, env=env)

    try:
        deadline = time.monotonic() + 2.0
        while not ready_marker.exists() and time.monotonic() < deadline:
            time.sleep(0.02)
        assert ready_marker.exists(), "holder process never signaled lock acquisition"

        with pytest.raises(OperationLockTimeoutError):
            with operation_lock("demo-reset", tmp_path, timeout_seconds=0.15):
                pass
    finally:
        proc.wait(timeout=5)
