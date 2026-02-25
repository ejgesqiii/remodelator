from __future__ import annotations

import hashlib
import json
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, Request
from fastapi import Query

from remodelator.application import service
from remodelator.application.billing_policy import (
    billing_policy_payload,
    normalize_gateway_event_type,
    resolve_estimate_charge_amount,
    resolve_estimate_charge_details,
    resolve_gateway_event_amount,
    resolve_gateway_event_details,
    resolve_subscription_amount,
    resolve_subscription_details,
)
from remodelator.application.billing_runtime import BillingCommand
from remodelator.application.billing_runtime import execute_billing_command
from remodelator.application.stripe_service import StripeService
from remodelator.config import get_settings
from remodelator.infra.db import session_scope
from remodelator.interfaces.api.constants import API_LIMIT_MAX, API_LIMIT_MIN, DEFAULT_BILLING_LEDGER_LIMIT
from remodelator.interfaces.api.dependencies import require_user_id
from remodelator.interfaces.api.router_utils import handle
from remodelator.interfaces.api.schemas import BillingRequest
from remodelator.interfaces.api.schemas import BillingPolicyResponse
from remodelator.interfaces.api.schemas import BillingProviderStatusResponse
from remodelator.interfaces.api.schemas import BillingSubscriptionStateResponse
from remodelator.interfaces.api.schemas import BillingSimulationEventRequest
from remodelator.interfaces.api.schemas import BillingSubscriptionRequest
from remodelator.interfaces.api.schemas import EstimateChargeRequest

router = APIRouter()


def _coerce_string(value: object) -> str:
    if isinstance(value, str):
        return value.strip()
    return ""


def _coerce_int(value: object, default: int = 0) -> int:
    try:
        return int(value)  # type: ignore[arg-type]
    except Exception:
        return default


def _extract_event_object(event: dict[str, Any]) -> dict[str, Any]:
    data = event.get("data")
    if not isinstance(data, dict):
        return {}
    obj = data.get("object")
    if not isinstance(obj, dict):
        return {}
    return obj


def _coerce_event_dict(event: object, raw_payload: bytes) -> dict[str, Any]:
    # Stripe SDK returns a StripeObject with to_dict_recursive(); tests may patch with plain dict.
    if isinstance(event, dict):
        event_dict = event
    elif hasattr(event, "to_dict_recursive"):
        event_dict = event.to_dict_recursive()  # type: ignore[assignment]
    else:
        event_dict = {}

    if _coerce_string(event_dict.get("type")):
        return event_dict

    # Fallback for mocked verification paths that return partial objects.
    try:
        parsed = json.loads(raw_payload.decode("utf-8"))
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    return event_dict


def _stable_webhook_event_id(event: dict[str, Any], raw_payload: bytes) -> str:
    event_id = _coerce_string(event.get("id"))
    if event_id:
        return event_id
    payload_hash = hashlib.sha256(raw_payload).hexdigest()[:24]
    return f"evt_payload_{payload_hash}"


@router.post("/billing/simulate-subscription")
def billing_subscription(payload: BillingSubscriptionRequest, user_id: str = Depends(require_user_id)) -> dict[str, str]:
    def action() -> dict[str, str]:
        settings = get_settings()
        with session_scope() as session:
            amount = resolve_subscription_amount(settings, payload.amount)
            details = resolve_subscription_details(payload.details)
            return execute_billing_command(
                session,
                user_id,
                BillingCommand(
                    event_type="subscription",
                    amount=amount,
                    details=details,
                    idempotency_key=payload.idempotency_key,
                ),
            )

    return handle(action)


@router.post("/billing/simulate-estimate-charge")
def billing_estimate_charge(
    payload: EstimateChargeRequest,
    user_id: str = Depends(require_user_id),
) -> dict[str, str]:
    def action() -> dict[str, str]:
        settings = get_settings()
        with session_scope() as session:
            charge_amount = resolve_estimate_charge_amount(settings, payload.amount)
            details = resolve_estimate_charge_details(payload.estimate_id, payload.details)
            return execute_billing_command(
                session,
                user_id,
                BillingCommand(
                    event_type="estimate_charge",
                    amount=charge_amount,
                    details=details,
                    idempotency_key=payload.idempotency_key,
                ),
            )

    return handle(action)


@router.post("/billing/simulate-event")
def billing_simulate_event(payload: BillingSimulationEventRequest, user_id: str = Depends(require_user_id)) -> dict[str, str]:
    def action() -> dict[str, str]:
        settings = get_settings()
        event_type = normalize_gateway_event_type(payload.event_type)
        amount = resolve_gateway_event_amount(settings, event_type, payload.amount)
        details = resolve_gateway_event_details(event_type, payload.details)
        with session_scope() as session:
            return execute_billing_command(
                session,
                user_id,
                BillingCommand(
                    event_type=event_type,
                    amount=amount,
                    details=details,
                    idempotency_key=payload.idempotency_key,
                ),
            )

    return handle(action)


@router.post("/billing/simulate-refund")
def billing_refund(payload: BillingRequest, user_id: str = Depends(require_user_id)) -> dict[str, str]:
    def action() -> dict[str, str]:
        with session_scope() as session:
            return execute_billing_command(
                session,
                user_id,
                BillingCommand(
                    event_type="refund",
                    amount=payload.amount * Decimal("-1"),
                    details=payload.details,
                    idempotency_key=payload.idempotency_key,
                ),
            )

    return handle(action)


@router.get("/billing/policy", response_model=BillingPolicyResponse)
def billing_policy() -> BillingPolicyResponse:
    return BillingPolicyResponse.model_validate(billing_policy_payload(get_settings()))


@router.get("/billing/provider-status", response_model=BillingProviderStatusResponse)
def billing_provider_status(user_id: str = Depends(require_user_id)) -> BillingProviderStatusResponse:
    _ = user_id
    status = service.billing_provider_status()
    return BillingProviderStatusResponse.model_validate(status)


@router.get("/billing/subscription-state", response_model=BillingSubscriptionStateResponse)
def billing_subscription_state(
    subscription_id: str | None = Query(default=None),
    user_id: str = Depends(require_user_id),
) -> BillingSubscriptionStateResponse:
    def action() -> BillingSubscriptionStateResponse:
        with session_scope() as session:
            state = service.subscription_state(session, user_id, subscription_id=subscription_id)
            return BillingSubscriptionStateResponse.model_validate(state)

    return handle(action)


@router.get("/billing/ledger")
def billing_ledger(
    limit: int = Query(default=DEFAULT_BILLING_LEDGER_LIMIT, ge=API_LIMIT_MIN, le=API_LIMIT_MAX),
    user_id: str = Depends(require_user_id),
) -> list[dict[str, str]]:
    def action() -> list[dict[str, str]]:
        with session_scope() as session:
            return service.list_billing_ledger(session, user_id, limit)

    return handle(action)


@router.post("/billing/webhook")
async def billing_webhook(request: Request) -> dict[str, str]:
    """
    Public webhook receiver for Stripe.
    Signature verification ensures authenticity.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    def action() -> dict[str, str]:
        if not sig_header:
            raise ValueError("Missing stripe-signature header")

        stripe_service = StripeService(get_settings(), require_secret_key=False)
        try:
            verified_event = stripe_service.verify_webhook_signature(payload, sig_header)
        except ValueError as exc:
            raise ValueError(f"Webhook signature verification failed: {exc}") from exc

        event = _coerce_event_dict(verified_event, payload)
        evt_type = _coerce_string(event.get("type"))
        if not evt_type:
            raise ValueError("Webhook event type is missing.")

        event_id = _stable_webhook_event_id(event, payload)
        idempotency_key = f"stripe_evt:{event_id}"
        data_object = _extract_event_object(event)
        customer_id = _coerce_string(data_object.get("customer"))
        subscription_id = _coerce_string(data_object.get("subscription")) or _coerce_string(data_object.get("id"))

        with session_scope() as session:
            user = None
            if customer_id:
                user = session.query(service.User).filter_by(stripe_customer_id=customer_id).first()

            if evt_type in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}:
                if not user:
                    return {"status": "ignored", "event_type": evt_type}
                if subscription_id:
                    user.stripe_subscription_id = subscription_id
                amount = Decimal(_coerce_int(data_object.get("amount_total"))) / 100
                detail = f"stripe checkout_completed event_id={event_id}"
                if subscription_id:
                    detail = f"{detail} subscription_id={subscription_id}"
                service.record_billing_event(
                    session,
                    user.id,
                    "subscription",
                    amount,
                    details=detail,
                    idempotency_key=idempotency_key,
                )
                return {"status": "success", "event_type": evt_type}

            if evt_type == "invoice.paid":
                if not user:
                    return {"status": "ignored", "event_type": evt_type}
                if subscription_id:
                    user.stripe_subscription_id = subscription_id
                amount = Decimal(_coerce_int(data_object.get("amount_paid"))) / 100
                detail = f"stripe invoice_paid event_id={event_id}"
                if subscription_id:
                    detail = f"{detail} subscription_id={subscription_id}"
                service.record_billing_event(
                    session,
                    user.id,
                    "invoice_paid",
                    amount,
                    details=detail,
                    idempotency_key=idempotency_key,
                )
                return {"status": "success", "event_type": evt_type}

            if evt_type == "invoice.payment_failed":
                if not user:
                    return {"status": "ignored", "event_type": evt_type}
                if subscription_id:
                    user.stripe_subscription_id = subscription_id
                amount = Decimal(_coerce_int(data_object.get("amount_due"))) / 100
                detail = f"stripe invoice_payment_failed event_id={event_id}"
                if subscription_id:
                    detail = f"{detail} subscription_id={subscription_id}"
                service.record_billing_event(
                    session,
                    user.id,
                    "invoice_payment_failed",
                    amount,
                    details=detail,
                    idempotency_key=idempotency_key,
                )
                return {"status": "success", "event_type": evt_type}

            if evt_type == "customer.subscription.deleted":
                if not user:
                    return {"status": "ignored", "event_type": evt_type}
                user.stripe_subscription_id = None
                detail = f"stripe subscription_canceled event_id={event_id}"
                service.record_billing_event(
                    session,
                    user.id,
                    "subscription_canceled",
                    Decimal("0"),
                    details=detail,
                    idempotency_key=idempotency_key,
                )
                return {"status": "success", "event_type": evt_type}

            if evt_type == "charge.refunded":
                if not user:
                    return {"status": "ignored", "event_type": evt_type}
                amount_cents = _coerce_int(data_object.get("amount_refunded"))
                amount = (Decimal(abs(amount_cents)) / 100) * Decimal("-1")
                detail = f"stripe refund event_id={event_id}"
                service.record_billing_event(
                    session,
                    user.id,
                    "refund",
                    amount,
                    details=detail,
                    idempotency_key=idempotency_key,
                )
                return {"status": "success", "event_type": evt_type}

        return {"status": "ignored", "event_type": evt_type}

    return handle(action)
