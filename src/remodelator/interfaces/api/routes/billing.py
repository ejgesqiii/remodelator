from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends
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


from fastapi import Request
from remodelator.application.stripe_service import StripeService


@router.post("/billing/webhook")
async def billing_webhook(request: Request) -> dict[str, str]:
    """
    Public webhook receiver for Stripe.
    Signature verification ensures authenticity.
    """
    settings = get_settings()
    stripe_service = StripeService(settings)

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        # Invalid request, but we must return a generic 400 to prevent probing
        return handle(lambda: (_ for _ in ()).throw(ValueError("Missing stripe-signature header")))

    try:
        event = stripe_service.verify_webhook_signature(payload, sig_header)
    except ValueError as e:
        return handle(lambda: (_ for _ in ()).throw(ValueError(f"Webhook signature verification failed: {str(e)}")))

    # Extract the payload object
    evt_type = event.get("type")
    data_object = event.get("data", {}).get("object", {})
    
    # Process supported events idiosyncratically
    with session_scope() as session:
        if evt_type == "checkout.session.completed":
            # Annual subscription purchased
            customer_id = data_object.get("customer")
            amount_cents = data_object.get("amount_total", 0)
            idempotency_key = event.get("request", {}).get("idempotency_key") or event.get("id")

            # Route 1: Find user by customer ID
            user = session.query(service.User).filter_by(stripe_customer_id=customer_id).first()
            if user:
                # Update subscription tracked ID if present in payload
                sub_id = data_object.get("subscription")
                if sub_id:
                    user.stripe_subscription_id = sub_id
                    
                service.record_billing_event(
                    session,
                    user.id,
                    "subscription",
                    Decimal(amount_cents) / 100,
                    details=f"Annual subscription via Stripe Checkout (Sub: {sub_id})",
                    idempotency_key=idempotency_key
                )
                session.commit()

        elif evt_type == "customer.subscription.deleted":
            # Subscription canceled
            customer_id = data_object.get("customer")
            idempotency_key = event.get("id")
            
            user = session.query(service.User).filter_by(stripe_customer_id=customer_id).first()
            if user:
                user.stripe_subscription_id = None
                service.record_billing_event(
                    session,
                    user.id,
                    "subscription_canceled",
                    Decimal("0"),
                    details="Subscription was canceled in Stripe.",
                    idempotency_key=idempotency_key
                )
                session.commit()
                
        elif evt_type == "charge.refunded":
            # Usage charge or subscription refunded
            customer_id = data_object.get("customer")
            amount_cents = data_object.get("amount_refunded", 0)
            idempotency_key = event.get("id")
            
            user = session.query(service.User).filter_by(stripe_customer_id=customer_id).first()
            if user:
                service.record_billing_event(
                    session,
                    user.id,
                    "refund",
                    (Decimal(amount_cents) / 100) * -1,
                    details="Refund issued via Stripe.",
                    idempotency_key=idempotency_key
                )
                session.commit()

    # Always return a 200 OK so Stripe knows we received the event
    return {"status": "success"}
