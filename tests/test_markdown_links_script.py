from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_markdown_link_check_passes_for_active_docs() -> None:
    result = subprocess.run(
        ["python3", "scripts/check_markdown_links.py", "--check"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
