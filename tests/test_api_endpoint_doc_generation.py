from __future__ import annotations

import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT / "scripts" / "generate_api_endpoints_doc.py"


def _load_doc_generator_module():
    spec = importlib.util.spec_from_file_location("generate_api_endpoints_doc", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Failed to load module from {SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_generated_endpoint_markdown_includes_lifecycle_and_deprecation() -> None:
    module = _load_doc_generator_module()
    rendered = module.render_markdown()

    assert "| Method | Path | Domain | Auth | Lifecycle |" in rendered
    assert "| POST | `/pricing/llm/live` | LLM Pricing | User (`x-session-token`) | Active |" in rendered
    assert "| POST | `/pricing/llm/simulate` | LLM Pricing | User (`x-session-token`) | Deprecated |" in rendered
