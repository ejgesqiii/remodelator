from __future__ import annotations

import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"


def test_ci_sqlite_probes_script_runs_with_overrides(tmp_path: Path) -> None:
    data_dir = tmp_path / "ci_sqlite_data"
    output_dir = tmp_path / "ci_probe_outputs"

    env = os.environ.copy()
    env["PYTHONPATH"] = str(SRC)
    env["REMODELATOR_CI_SQLITE_DATA_DIR"] = str(data_dir)
    env["REMODELATOR_CI_OUTPUT_DIR"] = str(output_dir)

    subprocess.check_call(["bash", "scripts/ci_sqlite_probes.sh"], cwd=ROOT, env=env)

    expected = [
        output_dir / "01_migrate.json",
        output_dir / "02_seed.json",
        output_dir / "03_integrity.json",
        output_dir / "04_maintenance.json",
        output_dir / "05_envelope.json",
    ]
    for path in expected:
        assert path.exists(), f"Missing probe artifact: {path}"
