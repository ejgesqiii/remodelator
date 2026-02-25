#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

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
        if not key:
            continue
        os.environ.setdefault(key, value.strip())


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class ProbeResult:
    generated_at: str
    stripe_api_version_requested: str
    stripe_api_version_effective: str | None
    account_id: str
    checkout_session_id: str
    checkout_url: str
    checkout_amount_cents: int
    checkout_currency: str
    payment_intent_id: str
    payment_intent_status: str
    payment_intent_amount_cents: int
    payment_intent_currency: str


def _response_version(resource: Any) -> str | None:
    last_response = getattr(resource, "last_response", None)
    headers = getattr(last_response, "headers", None)
    if isinstance(headers, dict):
        return headers.get("Stripe-Version")
    return None


def run_probe(*, amount_cents: int, currency: str, success_url: str, cancel_url: str) -> ProbeResult:
    account = stripe.Account.retrieve()
    probe_customer = stripe.Customer.create(
        email=f"probe-{uuid4()}@example.com",
        name="Remodelator Stripe Probe",
        metadata={"probe": "true"},
    )
    checkout = stripe.checkout.Session.create(
        customer=probe_customer.id,
        mode="payment",
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": currency.lower(),
                    "product_data": {"name": "Remodelator Stripe Probe"},
                    "unit_amount": amount_cents,
                },
                "quantity": 1,
            }
        ],
        success_url=success_url,
        cancel_url=cancel_url,
    )
    payment_intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency=currency.lower(),
        payment_method="pm_card_visa",
        confirm=True,
        description="Remodelator Stripe sandbox probe",
        metadata={"probe": "true"},
    )

    return ProbeResult(
        generated_at=_now_iso(),
        stripe_api_version_requested=str(stripe.api_version or ""),
        stripe_api_version_effective=_response_version(account) or _response_version(checkout),
        account_id=str(account.id),
        checkout_session_id=str(checkout.id),
        checkout_url=str(getattr(checkout, "url", "")),
        checkout_amount_cents=amount_cents,
        checkout_currency=currency.upper(),
        payment_intent_id=str(payment_intent.id),
        payment_intent_status=str(payment_intent.status),
        payment_intent_amount_cents=int(payment_intent.amount),
        payment_intent_currency=str(payment_intent.currency).upper(),
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a live Stripe sandbox probe and emit sanitized raw response data.")
    parser.add_argument("--env-file", default=".env", help="Optional dotenv file to preload (default: .env).")
    parser.add_argument("--amount-cents", type=int, default=1000, help="Probe charge amount in cents (default: 1000).")
    parser.add_argument("--currency", default="USD", help="Probe currency (default: USD).")
    parser.add_argument(
        "--output",
        default="data/stripe_probe/latest.json",
        help="Output JSON file for probe evidence (default: data/stripe_probe/latest.json).",
    )
    parser.add_argument(
        "--success-url",
        default="https://example.com/stripe-probe-success",
        help="Checkout success URL (default: https://example.com/stripe-probe-success).",
    )
    parser.add_argument(
        "--cancel-url",
        default="https://example.com/stripe-probe-cancel",
        help="Checkout cancel URL (default: https://example.com/stripe-probe-cancel).",
    )
    args = parser.parse_args()

    _load_env_file(Path(args.env_file))
    secret_key = os.getenv("STRIPE_SECRET_KEY", "").strip()
    if not secret_key:
        raise SystemExit("STRIPE_SECRET_KEY is required for stripe sandbox probe.")

    stripe.api_key = secret_key
    stripe.api_version = os.getenv("STRIPE_API_VERSION", "2026-01-28.clover").strip() or "2026-01-28.clover"

    amount_cents = max(50, int(args.amount_cents))
    currency = args.currency.strip().upper() or "USD"
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        result = run_probe(
            amount_cents=amount_cents,
            currency=currency,
            success_url=args.success_url.strip(),
            cancel_url=args.cancel_url.strip(),
        )
    except stripe.error.StripeError as exc:  # type: ignore[attr-defined]
        failure = {
            "status": "error",
            "generated_at": _now_iso(),
            "stripe_api_version_requested": str(stripe.api_version or ""),
            "error_type": exc.__class__.__name__,
            "error_message": str(exc),
        }
        output_path.write_text(json.dumps(failure, indent=2, sort_keys=True) + "\n")
        print(json.dumps({"status": "error", "output": str(output_path), "probe": failure}, indent=2))
        return 2

    output_path.write_text(json.dumps(asdict(result), indent=2, sort_keys=True) + "\n")
    print(json.dumps({"status": "ok", "output": str(output_path), "probe": asdict(result)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
