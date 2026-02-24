from remodelator.infra.llm.openrouter import _parse_json_content


def test_parse_json_content_plain() -> None:
    parsed = _parse_json_content('{"suggested_unit_price": 99.5, "confidence": 0.8, "rationale": "ok"}')
    assert parsed["suggested_unit_price"] == 99.5


def test_parse_json_content_fenced() -> None:
    content = """```json
    {"suggested_unit_price": 101, "confidence": 0.72, "rationale": "fenced"}
    ```"""
    parsed = _parse_json_content(content)
    assert parsed["rationale"] == "fenced"
