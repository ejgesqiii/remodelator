from __future__ import annotations

import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_stripe_sandbox_probe_help_runs() -> None:
    result = subprocess.run(
        ["python3", "scripts/stripe_sandbox_probe.py", "--help"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    assert "stripe sandbox probe" in result.stdout.lower()


def test_stripe_webhook_golden_path_help_runs() -> None:
    result = subprocess.run(
        ["python3", "scripts/stripe_webhook_golden_path.py", "--help"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    assert "webhook golden path" in result.stdout.lower()


def test_stripe_release_gate_help_runs() -> None:
    result = subprocess.run(
        ["bash", "scripts/stripe_release_gate.sh", "--help"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    assert "stripe release readiness checks" in result.stdout.lower()
