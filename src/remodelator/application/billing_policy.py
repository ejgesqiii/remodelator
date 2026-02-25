from __future__ import annotations

from decimal import Decimal

from remodelator.config import Settings

SIMULATED_GATEWAY_EVENT_TYPES = frozenset(
    {
        "payment_method_attached",
        "checkout_completed",
        "invoice_paid",
        "invoice_payment_failed",
        "usage_charge",
        "subscription_canceled",
    }
)

SUBSCRIPTION_LIFECYCLE_EVENT_TYPES = frozenset(
    {
        "subscription",
        "checkout_completed",
        "invoice_paid",
        "invoice_payment_failed",
        "subscription_canceled",
    }
)


def billing_policy_payload(settings: Settings) -> dict[str, str]:
    return {
        "mode": "hybrid",
        "annual_subscription_amount": f"{settings.billing_annual_subscription_amount:.2f}",
        "realtime_pricing_amount": f"{settings.billing_realtime_pricing_amount:.2f}",
        "currency": settings.billing_currency,
    }


def billing_provider_status_payload(settings: Settings) -> dict[str, object]:
    provider = settings.billing_provider
    stripe_key_configured = bool(settings.stripe_secret_key)
    stripe_webhook_secret_configured = bool(settings.stripe_webhook_secret)

    if provider == "stripe":
        if not stripe_key_configured:
            return {
                "provider": "stripe",
                "live_mode": "live",
                "adapter_ready": False,
                "ready_for_live": False,
                "stripe_key_configured": False,
                "stripe_webhook_secret_configured": stripe_webhook_secret_configured,
                "blocker_reason": "STRIPE_SECRET_KEY is not configured.",
            }
        if not stripe_webhook_secret_configured:
            return {
                "provider": "stripe",
                "live_mode": "live",
                "adapter_ready": False,
                "ready_for_live": False,
                "stripe_key_configured": True,
                "stripe_webhook_secret_configured": False,
                "blocker_reason": "STRIPE_WEBHOOK_SECRET is not configured.",
            }
        return {
            "provider": "stripe",
            "live_mode": "live",
            "adapter_ready": True,
            "ready_for_live": True,
            "stripe_key_configured": True,
            "stripe_webhook_secret_configured": True,
            "blocker_reason": None,
        }

    return {
        "provider": "simulation",
        "live_mode": "simulation",
        "adapter_ready": True,
        "ready_for_live": False,
        "stripe_key_configured": stripe_key_configured,
        "stripe_webhook_secret_configured": stripe_webhook_secret_configured,
        "blocker_reason": "Stripe live adapter is not enabled in this demo build.",
    }


def resolve_subscription_amount(settings: Settings, requested_amount: Decimal | None) -> Decimal:
    return requested_amount if requested_amount is not None else settings.billing_annual_subscription_amount


def resolve_estimate_charge_amount(settings: Settings, requested_amount: Decimal | None) -> Decimal:
    return requested_amount if requested_amount is not None else settings.billing_realtime_pricing_amount


def resolve_estimate_charge_details(estimate_id: str, details: str) -> str:
    details_note = details.strip() or "real-time pricing simulation"
    return f"estimate_id={estimate_id}; {details_note}"


def resolve_subscription_details(details: str) -> str:
    return details.strip() or "annual subscription simulation"


def normalize_gateway_event_type(event_type: str) -> str:
    normalized = event_type.strip().lower()
    if normalized not in SIMULATED_GATEWAY_EVENT_TYPES:
        allowed = ", ".join(sorted(SIMULATED_GATEWAY_EVENT_TYPES))
        raise ValueError(f"Unsupported simulated billing event_type '{event_type}'. Allowed: {allowed}")
    return normalized


def resolve_gateway_event_amount(settings: Settings, event_type: str, requested_amount: Decimal | None) -> Decimal:
    if requested_amount is not None:
        return requested_amount
    if event_type == "checkout_completed":
        return settings.billing_annual_subscription_amount
    if event_type == "usage_charge":
        return settings.billing_realtime_pricing_amount
    return Decimal("0.00")


def resolve_gateway_event_details(event_type: str, details: str) -> str:
    return details.strip() or f"{event_type} simulation event"


def validate_gateway_lifecycle_transition(event_type: str, previous_event_type: str | None) -> None:
    if event_type == "payment_method_attached":
        return

    active_or_past_due_states = {
        "subscription",
        "checkout_completed",
        "invoice_paid",
        "invoice_payment_failed",
    }
    allowed_previous: dict[str, set[str | None]] = {
        "checkout_completed": {None, "payment_method_attached", "subscription_canceled"},
        "invoice_paid": active_or_past_due_states,
        "invoice_payment_failed": active_or_past_due_states,
        "usage_charge": active_or_past_due_states,
        "subscription_canceled": active_or_past_due_states,
    }

    allowed = allowed_previous.get(event_type)
    if allowed is None:
        return
    if previous_event_type not in allowed:
        previous_label = previous_event_type or "none"
        raise ValueError(
            f"Invalid billing lifecycle transition: cannot apply '{event_type}' after '{previous_label}'."
        )
