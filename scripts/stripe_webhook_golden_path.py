#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

import requests
import stripe


def _load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            continue
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        os.environ.setdefault(key, value)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _strip_error_text(response: requests.Response) -> str:
    try:
        payload = response.json()
        if isinstance(payload, dict):
            detail = payload.get("detail")
            if isinstance(detail, str):
                return detail
            return json.dumps(payload)[:400]
    except Exception:
        pass
    return response.text[:400]


def _stripe_response_version(resource: Any) -> str | None:
    last_response = getattr(resource, "last_response", None)
    headers = getattr(last_response, "headers", None)
    if hasattr(headers, "get"):
        return headers.get("Stripe-Version")
    return None


def _request_json(
    method: str,
    url: str,
    *,
    expected_status: int | set[int] = 200,
    headers: dict[str, str] | None = None,
    payload: Any | None = None,
    raw_content: bytes | None = None,
    timeout: float = 20.0,
) -> Any:
    if isinstance(expected_status, int):
        expected = {expected_status}
    else:
        expected = expected_status

    response = requests.request(
        method=method.upper(),
        url=url,
        headers=headers,
        json=payload if raw_content is None else None,
        data=raw_content,
        timeout=timeout,
    )
    if response.status_code not in expected:
        raise RuntimeError(
            f"{method.upper()} {url} failed with status {response.status_code}: {_strip_error_text(response)}"
        )
    if not response.content:
        return {}
    return response.json()


def _sign_stripe_payload(payload: bytes, webhook_secret: str, timestamp: int | None = None) -> str:
    ts = timestamp or int(time.time())
    signed_payload = f"{ts}.{payload.decode('utf-8')}".encode("utf-8")
    signature = hmac.new(webhook_secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    return f"t={ts},v1={signature}"


def _register_or_login(base_url: str, email: str, password: str, full_name: str) -> str:
    register = requests.post(
        f"{base_url}/auth/register",
        json={"email": email, "password": password, "full_name": full_name},
        timeout=20.0,
    )
    if register.status_code == 200:
        payload = register.json()
        return str(payload["session_token"])
    if register.status_code != 400:
        raise RuntimeError(f"Register failed: {register.status_code} {_strip_error_text(register)}")

    login = requests.post(
        f"{base_url}/auth/login",
        json={"email": email, "password": password},
        timeout=20.0,
    )
    if login.status_code != 200:
        raise RuntimeError(f"Login failed: {login.status_code} {_strip_error_text(login)}")
    payload = login.json()
    return str(payload["session_token"])


@dataclass
class GoldenPathResult:
    generated_at: str
    api_base_url: str
    email: str
    provider: str
    provider_ready: bool
    customer_id: str
    subscription_id: str
    replay_subscription_events: int
    subscription_status_after_checkout: str
    subscription_status_after_invoice_paid: str
    subscription_status_after_invoice_failed: str
    subscription_status_after_canceled: str
    ledger_event_types: list[str]
    ledger_event_count: int
    stripe_api_version_requested: str
    stripe_api_version_effective: str | None


def run_golden_path(*, base_url: str, password: str) -> GoldenPathResult:
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
    secret_key = os.getenv("STRIPE_SECRET_KEY", "").strip()
    if not webhook_secret:
        raise RuntimeError("STRIPE_WEBHOOK_SECRET is required.")
    if not secret_key:
        raise RuntimeError("STRIPE_SECRET_KEY is required.")

    stripe.api_key = secret_key
    stripe.api_version = os.getenv("STRIPE_API_VERSION", "2026-01-28.clover").strip() or "2026-01-28.clover"

    _request_json("POST", f"{base_url}/db/migrate", expected_status={200, 403})
    email = f"stripe-webhook-golden-{uuid4()}@example.com"
    token = _register_or_login(base_url, email=email, password=password, full_name="Stripe Webhook Golden Path")
    auth_headers = {"x-session-token": token}

    provider = _request_json("GET", f"{base_url}/billing/provider-status", headers=auth_headers)
    provider_name = str(provider.get("provider", ""))
    adapter_ready = bool(provider.get("adapter_ready"))
    if provider_name != "stripe" or not adapter_ready:
        raise RuntimeError(f"Billing provider is not ready for stripe mode: {json.dumps(provider)}")

    sub_bootstrap = _request_json(
        "POST",
        f"{base_url}/billing/simulate-subscription",
        headers=auth_headers,
        payload={"idempotency_key": f"golden-sub-bootstrap-{uuid4()}"},
    )
    if not isinstance(sub_bootstrap, dict) or not sub_bootstrap.get("checkout_url"):
        raise RuntimeError(f"Unexpected subscription bootstrap response: {json.dumps(sub_bootstrap)}")

    stripe_customer = stripe.Customer.list(email=email, limit=1)
    if not stripe_customer.data:
        raise RuntimeError(f"Could not find Stripe customer by email: {email}")
    customer_id = str(stripe_customer.data[0].id)

    subscription_id = f"sub_golden_{uuid4().hex[:20]}"
    checkout_event = {
        "id": f"evt_golden_checkout_{uuid4().hex[:18]}",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "customer": customer_id,
                "subscription": subscription_id,
                "amount_total": 120000,
            }
        },
    }
    payload_bytes = json.dumps(checkout_event, separators=(",", ":")).encode("utf-8")
    sig_header = _sign_stripe_payload(payload_bytes, webhook_secret)
    webhook_headers = {"content-type": "application/json", "stripe-signature": sig_header}

    _request_json("POST", f"{base_url}/billing/webhook", headers=webhook_headers, raw_content=payload_bytes)
    _request_json("POST", f"{base_url}/billing/webhook", headers=webhook_headers, raw_content=payload_bytes)

    checkout_state = _request_json("GET", f"{base_url}/billing/subscription-state", headers=auth_headers)
    if checkout_state.get("status") != "active":
        raise RuntimeError(f"Expected active state after checkout; got: {json.dumps(checkout_state)}")

    def _send_signed_webhook(event: dict[str, Any]) -> None:
        evt_bytes = json.dumps(event, separators=(",", ":")).encode("utf-8")
        evt_sig = _sign_stripe_payload(evt_bytes, webhook_secret)
        evt_headers = {"content-type": "application/json", "stripe-signature": evt_sig}
        _request_json("POST", f"{base_url}/billing/webhook", headers=evt_headers, raw_content=evt_bytes)

    _send_signed_webhook(
        {
            "id": f"evt_golden_invoice_paid_{uuid4().hex[:18]}",
            "type": "invoice.paid",
            "data": {"object": {"customer": customer_id, "subscription": subscription_id, "amount_paid": 120000}},
        }
    )
    state_after_paid = _request_json("GET", f"{base_url}/billing/subscription-state", headers=auth_headers)
    if state_after_paid.get("status") != "active":
        raise RuntimeError(f"Expected active state after invoice.paid; got: {json.dumps(state_after_paid)}")

    _send_signed_webhook(
        {
            "id": f"evt_golden_invoice_failed_{uuid4().hex[:18]}",
            "type": "invoice.payment_failed",
            "data": {"object": {"customer": customer_id, "subscription": subscription_id, "amount_due": 120000}},
        }
    )
    state_after_failed = _request_json("GET", f"{base_url}/billing/subscription-state", headers=auth_headers)
    if state_after_failed.get("status") != "past_due":
        raise RuntimeError(f"Expected past_due state after invoice.payment_failed; got: {json.dumps(state_after_failed)}")

    _send_signed_webhook(
        {
            "id": f"evt_golden_refund_{uuid4().hex[:18]}",
            "type": "charge.refunded",
            "data": {"object": {"customer": customer_id, "amount_refunded": 1000}},
        }
    )

    _send_signed_webhook(
        {
            "id": f"evt_golden_cancel_{uuid4().hex[:18]}",
            "type": "customer.subscription.deleted",
            "data": {"object": {"customer": customer_id, "subscription": subscription_id}},
        }
    )
    state_after_canceled = _request_json("GET", f"{base_url}/billing/subscription-state", headers=auth_headers)
    if state_after_canceled.get("status") != "canceled":
        raise RuntimeError(f"Expected canceled state after subscription.deleted; got: {json.dumps(state_after_canceled)}")

    ledger_rows = _request_json("GET", f"{base_url}/billing/ledger?limit=50", headers=auth_headers)
    if not isinstance(ledger_rows, list):
        raise RuntimeError("Ledger payload is not a list.")
    event_types = [str(row.get("event_type", "")) for row in ledger_rows if isinstance(row, dict)]
    replay_sub_count = sum(1 for ev in event_types if ev == "subscription")
    if replay_sub_count != 1:
        raise RuntimeError(f"Expected one subscription event after replay dedupe; got {replay_sub_count}")
    required = {"subscription", "invoice_paid", "invoice_payment_failed", "refund", "subscription_canceled"}
    missing = sorted(required - set(event_types))
    if missing:
        raise RuntimeError(f"Ledger missing expected events: {missing}")

    return GoldenPathResult(
        generated_at=_now_iso(),
        api_base_url=base_url,
        email=email,
        provider=provider_name,
        provider_ready=adapter_ready,
        customer_id=customer_id,
        subscription_id=subscription_id,
        replay_subscription_events=replay_sub_count,
        subscription_status_after_checkout=str(checkout_state.get("status")),
        subscription_status_after_invoice_paid=str(state_after_paid.get("status")),
        subscription_status_after_invoice_failed=str(state_after_failed.get("status")),
        subscription_status_after_canceled=str(state_after_canceled.get("status")),
        ledger_event_types=event_types,
        ledger_event_count=len(event_types),
        stripe_api_version_requested=str(stripe.api_version or ""),
        stripe_api_version_effective=_stripe_response_version(stripe_customer),
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run an end-to-end signed Stripe webhook golden path against a running local API."
    )
    parser.add_argument("--env-file", default=".env", help="Optional dotenv file to preload (default: .env).")
    parser.add_argument(
        "--api-base-url",
        default="http://127.0.0.1:8000",
        help="API base URL for webhook scenario (default: http://127.0.0.1:8000).",
    )
    parser.add_argument(
        "--password",
        default="pw123456",
        help="Temporary user password for scenario account (default: pw123456).",
    )
    parser.add_argument(
        "--output",
        default="data/stripe_webhook_golden_path/latest.json",
        help="Output JSON file for run evidence (default: data/stripe_webhook_golden_path/latest.json).",
    )
    args = parser.parse_args()

    _load_env_file(Path(args.env_file))
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        result = run_golden_path(base_url=args.api_base_url.rstrip("/"), password=args.password)
    except Exception as exc:
        payload = {
            "status": "error",
            "generated_at": _now_iso(),
            "api_base_url": args.api_base_url.rstrip("/"),
            "error_type": exc.__class__.__name__,
            "error_message": str(exc),
        }
        output_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
        print(json.dumps({"status": "error", "output": str(output_path), "result": payload}, indent=2))
        return 2

    payload = asdict(result)
    output_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    print(json.dumps({"status": "ok", "output": str(output_path), "result": payload}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
