from __future__ import annotations

import json
import re
import time
from decimal import Decimal

import httpx

from remodelator.config import get_settings
from remodelator.domain.pricing import d


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
TRANSIENT_STATUS_CODES = {408, 409, 425, 429, 500, 502, 503, 504}


class OpenRouterError(RuntimeError):
    pass


def _parse_json_content(content: str) -> dict:
    # Fast path: plain JSON payload.
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # Common model behavior: fenced code block.
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content, flags=re.DOTALL | re.IGNORECASE)
    if fence_match:
        return json.loads(fence_match.group(1))

    # Last resort: first {...} block.
    brace_match = re.search(r"(\{.*\})", content, flags=re.DOTALL)
    if brace_match:
        return json.loads(brace_match.group(1))

    raise ValueError(f"Model response was not valid JSON: {content}")


def _request_completion(payload: dict, headers: dict[str, str], timeout_seconds: float, retries: int, retry_backoff_seconds: float) -> dict:
    attempt = 0
    while attempt <= retries:
        try:
            with httpx.Client(timeout=timeout_seconds) as client:
                response = client.post(OPENROUTER_URL, headers=headers, json=payload)
        except httpx.RequestError as exc:
            if attempt < retries:
                time.sleep(retry_backoff_seconds * (2**attempt))
                attempt += 1
                continue
            raise OpenRouterError(f"OpenRouter network error: {exc}") from exc

        if response.status_code in TRANSIENT_STATUS_CODES and attempt < retries:
            time.sleep(retry_backoff_seconds * (2**attempt))
            attempt += 1
            continue

        if response.status_code >= 400:
            try:
                detail = response.json()
            except ValueError:
                detail = response.text
            raise OpenRouterError(f"OpenRouter HTTP {response.status_code}: {detail}")

        try:
            return response.json()
        except ValueError as exc:
            raise OpenRouterError("OpenRouter response was not valid JSON.") from exc

    raise OpenRouterError("OpenRouter request exhausted retries.")


def suggest_price(item_name: str, current_unit_price: Decimal, context: str = "") -> dict[str, str]:
    settings = get_settings()
    if not settings.openrouter_api_key:
        raise OpenRouterError("OPENROUTER_API_KEY is not set.")

    prompt = (
        "You are a pricing assistant for home remodeling estimates. "
        "Return strict JSON with keys: suggested_unit_price (number), confidence (0-1 number), rationale (short string). "
        "No markdown, no extra keys. "
        f"Item: {item_name}. Current unit price: {d(current_unit_price)} USD. Context: {context or 'none'}."
    )

    payload = {
        "model": settings.openrouter_model,
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": "Output strict JSON only.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    }

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://remodelator.local",
        "X-Title": "Remodelator vNext",
    }

    data = _request_completion(
        payload=payload,
        headers=headers,
        timeout_seconds=settings.openrouter_timeout_seconds,
        retries=max(settings.openrouter_max_retries, 0),
        retry_backoff_seconds=max(settings.openrouter_retry_backoff_seconds, 0),
    )

    try:
        content = str(data["choices"][0]["message"]["content"]).strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise OpenRouterError(f"OpenRouter response missing choices/message content: {data}") from exc

    try:
        parsed = _parse_json_content(content)
    except (ValueError, json.JSONDecodeError) as exc:
        raise OpenRouterError(f"Failed to parse model JSON payload: {exc}") from exc

    try:
        suggested = d(parsed.get("suggested_unit_price", current_unit_price)).quantize(Decimal("0.01"))
    except (ArithmeticError, ValueError):
        suggested = d(current_unit_price).quantize(Decimal("0.01"))

    try:
        confidence = d(parsed.get("confidence", "0.70"))
    except (ArithmeticError, ValueError):
        confidence = Decimal("0.70")
    confidence = min(max(confidence, Decimal("0.00")), Decimal("1.00")).quantize(Decimal("0.01"))

    rationale = str(parsed.get("rationale") or "No rationale provided.")

    return {
        "item_name": item_name,
        "current_unit_price": str(d(current_unit_price).quantize(Decimal("0.01"))),
        "suggested_unit_price": str(suggested),
        "confidence": str(confidence),
        "rationale": rationale,
        "model": settings.openrouter_model,
        "provider": "openrouter",
        "mode": "live",
    }
