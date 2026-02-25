from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

# Isolate pytest runs from the repository's persistent `data/` SQLite files.
# Individual tests may override this environment variable when needed.
os.environ.setdefault(
    "REMODELATOR_DATA_DIR",
    str(Path(tempfile.mkdtemp(prefix="remodelator_pytest_data_")) / "data"),
)
