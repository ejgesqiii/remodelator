from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]


# Ensure app imports with isolated local data directory for test run.
TEST_DATA_DIR = Path(tempfile.mkdtemp(prefix="remodelator_test_api_"))
os.environ["REMODELATOR_DATA_DIR"] = str(TEST_DATA_DIR)

from remodelator.interfaces.api.main import app  # noqa: E402
from remodelator.application import service  # noqa: E402
from remodelator.infra.db import session_scope  # noqa: E402
from remodelator.infra.models import AuditEvent  # noqa: E402
from remodelator.infra.operation_lock import OperationLockTimeoutError  # noqa: E402


client = TestClient(app)


def test_api_end_to_end(monkeypatch) -> None:
    def _openrouter_stub(item_name: str, current_unit_price, context: str = "") -> dict[str, str]:
        return {
            "item_name": item_name,
            "current_unit_price": str(current_unit_price),
            "suggested_unit_price": "91.00",
            "confidence": "0.80",
            "rationale": f"stubbed for tests ({context or 'no-context'})",
            "provider": "openrouter",
            "model": "google/gemini-2.5-flash",
            "mode": "live",
        }

    monkeypatch.setattr(service, "suggest_price_openrouter", _openrouter_stub)

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"
    assert health.json()["db"] == "ok"
    assert client.post("/db/migrate").status_code == 200
    assert client.post("/db/seed").status_code == 200

    weak_password_attempt = client.post(
        "/auth/register",
        json={"email": "weak@example.com", "password": "short", "full_name": "Weak User"},
    )
    assert weak_password_attempt.status_code == 422
    extra_register_field_attempt = client.post(
        "/auth/register",
        json={"email": "strict@example.com", "password": "pw123456", "full_name": "Strict User", "unexpected": "x"},
    )
    assert extra_register_field_attempt.status_code == 422
    invalid_catalog_limit = client.get("/catalog/search?query=counter&limit=0")
    assert invalid_catalog_limit.status_code == 422

    reg = client.post(
        "/auth/register",
        json={"email": "api@example.com", "password": "pw123456", "full_name": "API Demo"},
    )
    if reg.status_code != 200:
        login = client.post("/auth/login", json={"email": "api@example.com", "password": "pw123456"})
        assert login.status_code == 200
        session_token = login.json()["session_token"]
        user_id = login.json()["user_id"]
    else:
        session_token = reg.json()["session_token"]
        user_id = reg.json()["user_id"]

    headers = {"x-session-token": session_token}
    metadata_login = client.post("/auth/login", json={"email": "api@example.com", "password": "pw123456"})
    assert metadata_login.status_code == 200

    invalid_token_profile = client.get("/profile", headers={"x-session-token": "bad.token"})
    assert invalid_token_profile.status_code == 401
    assert invalid_token_profile.json()["error"]["code"] == "auth_error"
    assert invalid_token_profile.json()["error"]["status"] == 401
    legacy_header_profile = client.get("/profile", headers={"x-user-id": "legacy-user"})
    assert legacy_header_profile.status_code == 401
    assert legacy_header_profile.json()["error"]["code"] == "auth_error"
    profile = client.get("/profile", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["role"] in {"user", "admin"}

    estimate = client.post(
        "/estimates",
        headers=headers,
        json={"title": "API Kitchen", "customer_name": "Alice"},
    )
    assert estimate.status_code == 200
    estimate_id = estimate.json()["id"]

    quickstart = client.post(
        f"/estimates/{estimate_id}/quickstart",
        headers=headers,
        json={"catalog_node_name": "Bathroom", "max_items": 2},
    )
    assert quickstart.status_code == 200
    assert len(quickstart.json().get("line_items", [])) >= 1

    li = client.post(
        f"/estimates/{estimate_id}/line-items",
        headers=headers,
        json={
            "item_name": "Countertop Install",
            "quantity": "2",
            "unit_price": "85",
            "labor_hours": "2.5",
        },
    )
    assert li.status_code == 200
    line_item_id = li.json()["id"]

    reorder = client.post(
        f"/estimates/{estimate_id}/line-items/{line_item_id}/reorder",
        headers=headers,
        json={"new_index": 0},
    )
    assert reorder.status_code == 200

    grouping = client.post(
        f"/estimates/{estimate_id}/line-items/group",
        headers=headers,
        json={"group_name": "Phase-1"},
    )
    assert grouping.status_code == 200

    llm_status = client.get("/pricing/llm/status")
    assert llm_status.status_code == 200
    assert llm_status.json()["provider"] == "openrouter"
    assert llm_status.json()["simulation_available"] is False

    llm_live_unauthorized = client.post(
        "/pricing/llm/live",
        json={"item_name": "Countertop Install", "current_unit_price": "85", "context": "api test"},
    )
    assert llm_live_unauthorized.status_code == 401

    llm_live = client.post(
        "/pricing/llm/live",
        headers=headers,
        json={"item_name": "Countertop Install", "current_unit_price": "85", "context": "api test"},
    )
    assert llm_live.status_code == 200
    assert llm_live.json()["mode"] == "live"
    llm_price = llm_live.json()["suggested_unit_price"]

    llm_alias = client.post(
        "/pricing/llm/simulate",
        headers=headers,
        json={"item_name": "Countertop Install", "current_unit_price": "85", "context": "api test"},
    )
    assert llm_alias.status_code == 200
    assert llm_alias.json()["mode"] == "live"

    llm_apply = client.post(
        "/pricing/llm/apply",
        headers=headers,
        json={
            "estimate_id": estimate_id,
            "line_item_id": line_item_id,
            "suggested_price": llm_price,
        },
    )
    assert llm_apply.status_code == 200
    assert llm_apply.json()["id"] == line_item_id

    catalog_upsert = client.post(
        "/catalog/upsert",
        headers=headers,
        json={
            "name": "API Custom Item",
            "unit_price": "123.45",
            "labor_hours": "1.25",
            "description": "Added from API test",
        },
    )
    assert catalog_upsert.status_code == 200
    assert catalog_upsert.json()["action"] in {"catalog.item.create", "catalog.item.update"}

    catalog_import = client.post(
        "/catalog/import",
        headers=headers,
        json={
            "items": [
                {"name": "API Import 1", "unit_price": "11.50", "labor_hours": "0.75"},
                {"name": "API Import 2", "unit_price": "21.00", "labor_hours": "1.20"},
            ]
        },
    )
    assert catalog_import.status_code == 200
    catalog_import_payload = catalog_import.json()
    assert catalog_import_payload["inserted"] + catalog_import_payload["updated"] >= 2

    catalog_search = client.get("/catalog/search?query=API%20Import&limit=10")
    assert catalog_search.status_code == 200
    assert len(catalog_search.json()) >= 2

    template_saved = client.post(
        "/templates/save",
        headers=headers,
        json={"estimate_id": estimate_id, "name": "API Template A"},
    )
    assert template_saved.status_code == 200
    template_id = template_saved.json()["template_id"]

    templates = client.get("/templates?limit=10", headers=headers)
    assert templates.status_code == 200
    assert any(row["id"] == template_id for row in templates.json())

    est_for_template = client.post(
        "/estimates",
        headers=headers,
        json={"title": "Template Target", "customer_name": "Bob"},
    )
    assert est_for_template.status_code == 200
    target_estimate_id = est_for_template.json()["id"]

    template_applied = client.post(
        "/templates/apply",
        headers=headers,
        json={"template_id": template_id, "estimate_id": target_estimate_id},
    )
    assert template_applied.status_code == 200
    assert len(template_applied.json().get("line_items", [])) >= 1

    export_path = TEST_DATA_DIR / "api_export_estimate.json"
    exported = client.post(
        f"/estimates/{estimate_id}/export",
        headers=headers,
        json={"output_path": str(export_path)},
    )
    assert exported.status_code == 200
    assert export_path.exists()

    forbidden_export = client.post(
        f"/estimates/{estimate_id}/export",
        headers=headers,
        json={"output_path": "/tmp/forbidden_estimate_export.json"},
    )
    assert forbidden_export.status_code == 400

    pdf_path = TEST_DATA_DIR / "api_proposal.pdf"
    pdf = client.post(
        f"/proposals/{estimate_id}/pdf",
        headers=headers,
        json={"output_path": str(pdf_path)},
    )
    assert pdf.status_code == 200
    assert pdf_path.exists()

    forbidden_pdf = client.post(
        f"/proposals/{estimate_id}/pdf",
        headers=headers,
        json={"output_path": "/tmp/forbidden_proposal.pdf"},
    )
    assert forbidden_pdf.status_code == 400

    versioned = client.post(f"/estimates/{estimate_id}/version", headers=headers)
    assert versioned.status_code == 200

    first_charge = client.post(
        "/billing/simulate-estimate-charge",
        headers=headers,
        json={"estimate_id": estimate_id, "idempotency_key": "api-charge-1"},
    )
    assert first_charge.status_code == 200
    assert first_charge.json()["amount"] == "10.00"
    second_charge = client.post(
        "/billing/simulate-estimate-charge",
        headers=headers,
        json={"estimate_id": estimate_id, "idempotency_key": "api-charge-1"},
    )
    assert second_charge.status_code == 200
    assert first_charge.json()["billing_event_id"] == second_charge.json()["billing_event_id"]
    assert second_charge.json()["idempotency_status"] == "replayed"

    invalid_usage_event = client.post(
        "/billing/simulate-event",
        headers=headers,
        json={"event_type": "usage_charge", "details": "usage before subscription"},
    )
    assert invalid_usage_event.status_code == 400
    assert invalid_usage_event.json()["error"]["code"] == "bad_request"
    assert "Invalid billing lifecycle transition" in invalid_usage_event.json()["detail"]

    subscription = client.post(
        "/billing/simulate-subscription",
        headers=headers,
        json={"amount": "49.00", "details": "monthly test subscription"},
    )
    assert subscription.status_code == 200
    assert subscription.json()["event_type"] == "subscription"

    billing_policy = client.get("/billing/policy")
    assert billing_policy.status_code == 200
    assert billing_policy.json()["mode"] == "hybrid"
    assert billing_policy.json()["annual_subscription_amount"] == "1200.00"
    assert billing_policy.json()["realtime_pricing_amount"] == "10.00"
    billing_provider_status = client.get("/billing/provider-status", headers=headers)
    assert billing_provider_status.status_code == 200
    assert billing_provider_status.json()["provider"] == "simulation"
    assert billing_provider_status.json()["adapter_ready"] is True
    assert billing_provider_status.json()["ready_for_live"] is True

    subscription_state_active = client.get("/billing/subscription-state", headers=headers)
    assert subscription_state_active.status_code == 200
    assert subscription_state_active.json()["status"] == "active"
    assert subscription_state_active.json()["active"] is True

    stripe_cancel = client.post(
        "/billing/simulate-event",
        headers=headers,
        json={
            "event_type": "subscription_canceled",
            "details": "stripe_sim subscription.canceled subscription_id=sub_api_001 reason=customer_requested",
        },
    )
    assert stripe_cancel.status_code == 200
    assert stripe_cancel.json()["event_type"] == "subscription_canceled"
    assert stripe_cancel.json()["amount"] == "0.00"

    subscription_state_canceled = client.get("/billing/subscription-state", headers=headers)
    assert subscription_state_canceled.status_code == 200
    assert subscription_state_canceled.json()["status"] == "canceled"
    assert subscription_state_canceled.json()["canceled"] is True

    refund = client.post(
        "/billing/simulate-refund",
        headers=headers,
        json={"amount": "10.00", "details": "partial test refund"},
    )
    assert refund.status_code == 200
    assert refund.json()["event_type"] == "refund"

    activity = client.get("/activity", headers=headers)
    assert activity.status_code == 200
    assert activity.json()["estimates"] >= 1

    backup_payload = client.get("/backup/export", headers=headers)
    assert backup_payload.status_code == 200
    assert backup_payload.json()["version"] == 1

    restore_payload = client.post("/backup/restore", headers=headers, json={"payload": backup_payload.json()})
    assert restore_payload.status_code == 200
    assert restore_payload.json()["estimates_restored"] >= 1

    admin_headers = {"x-admin-key": "local-admin-key"}
    admin_summary = client.get("/admin/summary", headers=admin_headers)
    assert admin_summary.status_code == 200
    assert admin_summary.json()["users"] >= 1

    admin_users = client.get("/admin/users?limit=10", headers=admin_headers)
    assert admin_users.status_code == 200
    assert len(admin_users.json()) >= 1
    admin_users_bad_limit = client.get("/admin/users?limit=0", headers=admin_headers)
    assert admin_users_bad_limit.status_code == 422
    admin_users_filtered = client.get("/admin/users?limit=10&search=api@example.com", headers=admin_headers)
    assert admin_users_filtered.status_code == 200
    api_user_row = next((row for row in admin_users_filtered.json() if row["email"] == "api@example.com"), None)
    assert api_user_row is not None
    assert isinstance(api_user_row["estimates_count"], int)
    assert isinstance(api_user_row["billing_events_count"], int)
    assert isinstance(api_user_row["audit_events_count"], int)
    assert "last_login_at" in api_user_row
    assert "last_activity_at" in api_user_row

    admin_activity_filtered = client.get("/admin/activity?limit=10&action=estimate.create", headers=admin_headers)
    assert admin_activity_filtered.status_code == 200
    assert all(row["action"] == "estimate.create" for row in admin_activity_filtered.json())

    admin_billing_filtered = client.get(
        f"/admin/billing-ledger?limit=10&event_type=subscription&user_id={user_id}",
        headers=admin_headers,
    )
    assert admin_billing_filtered.status_code == 200
    assert all(row["event_type"] == "subscription" for row in admin_billing_filtered.json())
    assert all(row["user_id"] == user_id for row in admin_billing_filtered.json())

    stale_timestamp = datetime.now(timezone.utc) - timedelta(days=30)
    with session_scope() as session:
        session.add(
            AuditEvent(
                id=str(uuid4()),
                user_id=user_id,
                action="test.stale",
                entity_type="system",
                entity_id="stale-event",
                details="stale audit row for prune contract test",
                created_at=stale_timestamp,
            )
        )

    admin_audit_preview = client.post("/admin/audit-prune?retention_days=7&dry_run=true", headers=admin_headers)
    assert admin_audit_preview.status_code == 200
    preview_payload = admin_audit_preview.json()
    assert preview_payload["status"] == "ok"
    assert preview_payload["retention_days"] == 7
    assert preview_payload["dry_run"] is True
    assert preview_payload["deleted"] >= 1

    admin_audit_prune = client.post("/admin/audit-prune?retention_days=7&dry_run=false", headers=admin_headers)
    assert admin_audit_prune.status_code == 200
    prune_payload = admin_audit_prune.json()
    assert prune_payload["status"] == "ok"
    assert prune_payload["retention_days"] == 7
    assert prune_payload["dry_run"] is False
    assert prune_payload["deleted"] >= 1

    demo_reset = client.post("/admin/demo-reset", headers=admin_headers)
    assert demo_reset.status_code == 200
    assert demo_reset.json()["status"] == "ok"


def test_production_guards(monkeypatch) -> None:
    monkeypatch.setenv("REMODELATOR_ENV", "production")

    migrate = client.post("/db/migrate")
    assert migrate.status_code == 403

    seed = client.post("/db/seed")
    assert seed.status_code == 403

    demo_reset = client.post("/admin/demo-reset", headers={"x-admin-key": "local-admin-key"})
    assert demo_reset.status_code == 403


def test_admin_demo_reset_returns_conflict_when_lock_is_held(monkeypatch) -> None:
    def _locked_reset() -> dict[str, object]:
        raise OperationLockTimeoutError("Operation 'admin-db-rebuild' is already in progress; retry shortly.")

    monkeypatch.setattr(service, "rebuild_demo_database", _locked_reset)
    response = client.post("/admin/demo-reset", headers={"x-admin-key": "local-admin-key"})
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "conflict"


def test_admin_reads_allow_admin_role_session(monkeypatch) -> None:
    monkeypatch.setenv("REMODELATOR_ADMIN_USER_EMAILS", "rbac-admin@example.com")

    register = client.post(
        "/auth/register",
        json={"email": "rbac-admin@example.com", "password": "pw123456", "full_name": "RBAC Admin"},
    )
    if register.status_code == 200:
        session_token = register.json()["session_token"]
    else:
        login = client.post("/auth/login", json={"email": "rbac-admin@example.com", "password": "pw123456"})
        assert login.status_code == 200
        session_token = login.json()["session_token"]

    allowed = client.get("/admin/summary", headers={"x-session-token": session_token})
    assert allowed.status_code == 200

    register_user = client.post(
        "/auth/register",
        json={"email": "rbac-user@example.com", "password": "pw123456", "full_name": "RBAC User"},
    )
    if register_user.status_code == 200:
        user_token = register_user.json()["session_token"]
    else:
        login_user = client.post("/auth/login", json={"email": "rbac-user@example.com", "password": "pw123456"})
        assert login_user.status_code == 200
        user_token = login_user.json()["session_token"]

    denied = client.get("/admin/summary", headers={"x-session-token": user_token})
    assert denied.status_code == 403


def test_llm_live_fails_loud_when_provider_unavailable(monkeypatch) -> None:
    def _raise_provider_failure(**_: object) -> dict[str, str]:
        raise RuntimeError("network timeout")

    monkeypatch.setattr(service, "suggest_price_openrouter", _raise_provider_failure)

    register = client.post(
        "/auth/register",
        json={"email": "llm-fail@example.com", "password": "pw123456", "full_name": "LLM Fail"},
    )
    if register.status_code == 200:
        session_token = register.json()["session_token"]
    else:
        login = client.post("/auth/login", json={"email": "llm-fail@example.com", "password": "pw123456"})
        assert login.status_code == 200
        session_token = login.json()["session_token"]

    response = client.post(
        "/pricing/llm/live",
        headers={"x-session-token": session_token},
        json={"item_name": "Countertop Install", "current_unit_price": "85.00", "context": "failure test"},
    )
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "dependency_unavailable"
    assert response.json()["error"]["status"] == 503
    assert "OpenRouter LLM request failed" in response.json()["detail"]


def test_llm_alias_fails_loud_when_provider_unavailable(monkeypatch) -> None:
    def _raise_provider_failure(**_: object) -> dict[str, str]:
        raise RuntimeError("provider offline")

    monkeypatch.setattr(service, "suggest_price_openrouter", _raise_provider_failure)

    register = client.post(
        "/auth/register",
        json={"email": "llm-alias-fail@example.com", "password": "pw123456", "full_name": "LLM Alias Fail"},
    )
    if register.status_code == 200:
        session_token = register.json()["session_token"]
    else:
        login = client.post("/auth/login", json={"email": "llm-alias-fail@example.com", "password": "pw123456"})
        assert login.status_code == 200
        session_token = login.json()["session_token"]

    response = client.post(
        "/pricing/llm/simulate",
        headers={"x-session-token": session_token},
        json={"item_name": "Countertop Install", "current_unit_price": "85.00", "context": "failure test"},
    )
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "dependency_unavailable"
    assert response.json()["error"]["status"] == 503
    assert "OpenRouter LLM request failed" in response.json()["detail"]


def test_billing_provider_status_blocks_when_stripe_selected_without_key(monkeypatch) -> None:
    monkeypatch.setenv("REMODELATOR_BILLING_PROVIDER", "stripe")
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)

    register = client.post(
        "/auth/register",
        json={"email": "stripe-status@example.com", "password": "pw123456", "full_name": "Stripe Status"},
    )
    if register.status_code == 200:
        token = register.json()["session_token"]
    else:
        login = client.post("/auth/login", json={"email": "stripe-status@example.com", "password": "pw123456"})
        assert login.status_code == 200
        token = login.json()["session_token"]

    status = client.get("/billing/provider-status", headers={"x-session-token": token})
    assert status.status_code == 200
    payload = status.json()
    assert payload["provider"] == "stripe"
    assert payload["adapter_ready"] is False
    assert payload["ready_for_live"] is False
    assert payload["blocker_reason"] == "STRIPE_SECRET_KEY is not configured."

    blocked_subscription = client.post(
        "/billing/simulate-subscription",
        headers={"x-session-token": token},
        json={},
    )
    assert blocked_subscription.status_code == 503
    assert blocked_subscription.json()["error"]["code"] == "dependency_unavailable"
    assert "Stripe API key is not configured." in blocked_subscription.json()["detail"]


def test_relative_export_paths_resolve_under_configured_data_dir() -> None:
    assert client.post("/db/migrate").status_code == 200
    assert client.post("/db/seed").status_code == 200

    register = client.post(
        "/auth/register",
        json={"email": "path-export@example.com", "password": "pw123456", "full_name": "Path Export"},
    )
    if register.status_code == 200:
        session_token = register.json()["session_token"]
    else:
        login = client.post("/auth/login", json={"email": "path-export@example.com", "password": "pw123456"})
        assert login.status_code == 200
        session_token = login.json()["session_token"]

    headers = {"x-session-token": session_token}
    estimate = client.post(
        "/estimates",
        headers=headers,
        json={"title": "Relative Path Check", "customer_name": "Path Demo"},
    )
    assert estimate.status_code == 200
    estimate_id = estimate.json()["id"]

    add_line = client.post(
        f"/estimates/{estimate_id}/line-items",
        headers=headers,
        json={"item_name": "Countertop Install", "quantity": "1", "unit_price": "85.00", "labor_hours": "1.0"},
    )
    assert add_line.status_code == 200

    estimate_export = client.post(
        f"/estimates/{estimate_id}/export",
        headers=headers,
        json={"output_path": "exports/relative_estimate.json"},
    )
    assert estimate_export.status_code == 200
    assert (TEST_DATA_DIR / "exports" / "relative_estimate.json").exists()

    proposal_pdf = client.post(
        f"/proposals/{estimate_id}/pdf",
        headers=headers,
        json={"output_path": "exports/relative_proposal.pdf"},
    )
    assert proposal_pdf.status_code == 200
    assert (TEST_DATA_DIR / "exports" / "relative_proposal.pdf").exists()


def test_stripe_webhook_flow(monkeypatch) -> None:
    monkeypatch.setenv("REMODELATOR_BILLING_PROVIDER", "stripe")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_123")

    register = client.post(
        "/auth/register",
        json={"email": "webhook-flow@example.com", "password": "pw123456", "full_name": "Webhook Flow"},
    )
    if register.status_code == 200:
        session_token = register.json()["session_token"]
    else:
        login = client.post("/auth/login", json={"email": "webhook-flow@example.com", "password": "pw123456"})
        assert login.status_code == 200
        session_token = login.json()["session_token"]

    # In a real scenario, the customer_id is set before checkout
    # Let's seed the db to simulate an existing customer link
    from remodelator.infra.db import session_scope
    from remodelator.application import service
    with session_scope() as session:
        user = session.query(service.User).filter_by(email="webhook-flow@example.com").first()
        user.stripe_customer_id = "cus_webhook_test_123"
        session.commit()

    # Reject without signature
    no_sig = client.post("/billing/webhook", json={"type": "checkout.session.completed"})
    assert no_sig.status_code == 400

    # Mock the verify_webhook_signature so we don't need real crypto
    import stripe
    def mock_verify(*args, **kwargs) -> stripe.Event:
        event = args[0] if isinstance(args[0], dict) else {}
        return stripe.Event.construct_from(event, "sk_test_123")
    
    monkeypatch.setattr("remodelator.application.stripe_service.StripeService.verify_webhook_signature", mock_verify)

    # 1. Checkout completed (annual subscription)
    checkout_event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "customer": "cus_webhook_test_123",
                "subscription": "sub_test_123",
                "amount_total": 120000
            }
        },
        "id": "evt_chk_123"
    }
    
    ch_resp = client.post(
        "/billing/webhook", 
        json=checkout_event,
        headers={"stripe-signature": "t=123,v1=fake"}
    )
    assert ch_resp.status_code == 200
    assert ch_resp.json()["status"] == "success"

    # Verify state via API
    headers = {"x-session-token": session_token}
    state = client.get("/billing/subscription-state", headers=headers)
    assert state.status_code == 200
    assert state.json()["subscription_id"] == "sub_test_123"
    assert state.json()["status"] == "active"
    assert state.json()["active"] is True

    # 2. Charge refunded
    refund_event = {
        "type": "charge.refunded",
        "data": {
            "object": {
                "customer": "cus_webhook_test_123",
                "amount_refunded": 1000
            }
        },
        "id": "evt_ref_123"
    }
    ref_resp = client.post(
        "/billing/webhook", 
        json=refund_event,
        headers={"stripe-signature": "t=123,v1=fake"}
    )
    assert ref_resp.status_code == 200

    # 3. Cancel subscription
    cancel_event = {
        "type": "customer.subscription.deleted",
        "data": {
            "object": {
                "customer": "cus_webhook_test_123",
                "subscription": "sub_test_123"
            }
        },
        "id": "evt_del_123"
    }
    can_resp = client.post(
        "/billing/webhook", 
        json=cancel_event,
        headers={"stripe-signature": "t=123,v1=fake"}
    )
    assert can_resp.status_code == 200

    state2 = client.get("/billing/subscription-state", headers=headers)
    assert state2.status_code == 200
    assert state2.json()["subscription_id"] is None
    assert state2.json()["status"] == "canceled"
    assert state2.json()["canceled"] is True

    # Confirm ledger events were recorded
    ledger = client.get("/billing/ledger?limit=10", headers=headers)
    assert ledger.status_code == 200
    events = ledger.json()
    assert any(e["event_type"] == "subscription" and e["amount"] == "1200.00" for e in events)
    assert any(e["event_type"] == "refund" and e["amount"] == "-10.00" for e in events)
    assert any(e["event_type"] == "subscription_canceled" for e in events)


def test_stripe_webhook_requires_configured_webhook_secret(monkeypatch) -> None:
    monkeypatch.setenv("REMODELATOR_BILLING_PROVIDER", "stripe")
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)

    response = client.post(
        "/billing/webhook",
        json={"type": "checkout.session.completed"},
        headers={"stripe-signature": "t=123,v1=fake"},
    )

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "dependency_unavailable"
    assert "STRIPE_WEBHOOK_SECRET is not configured." in response.json()["detail"]


def test_stripe_webhook_replay_and_invoice_events(monkeypatch) -> None:
    monkeypatch.setenv("REMODELATOR_BILLING_PROVIDER", "stripe")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_123")

    email = f"webhook-replay-{uuid4()}@example.com"
    register = client.post(
        "/auth/register",
        json={"email": email, "password": "pw123456", "full_name": "Webhook Replay"},
    )
    if register.status_code == 200:
        session_token = register.json()["session_token"]
    else:
        login = client.post("/auth/login", json={"email": email, "password": "pw123456"})
        assert login.status_code == 200
        session_token = login.json()["session_token"]

    with session_scope() as session:
        user = session.query(service.User).filter_by(email=email).first()
        assert user is not None
        user.stripe_customer_id = "cus_webhook_replay_123"

    def mock_verify(*args, **kwargs) -> dict:
        return {}

    monkeypatch.setattr("remodelator.application.stripe_service.StripeService.verify_webhook_signature", mock_verify)

    checkout_event = {
        "id": "evt_checkout_replay_123",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "customer": "cus_webhook_replay_123",
                "subscription": "sub_webhook_replay_123",
                "amount_total": 120000,
            }
        },
    }
    checkout_first = client.post(
        "/billing/webhook",
        json=checkout_event,
        headers={"stripe-signature": "t=123,v1=fake"},
    )
    checkout_second = client.post(
        "/billing/webhook",
        json=checkout_event,
        headers={"stripe-signature": "t=123,v1=fake"},
    )
    assert checkout_first.status_code == 200
    assert checkout_second.status_code == 200

    invoice_paid = client.post(
        "/billing/webhook",
        json={
            "id": "evt_invoice_paid_123",
            "type": "invoice.paid",
            "data": {
                "object": {
                    "customer": "cus_webhook_replay_123",
                    "subscription": "sub_webhook_replay_123",
                    "amount_paid": 120000,
                }
            },
        },
        headers={"stripe-signature": "t=123,v1=fake"},
    )
    assert invoice_paid.status_code == 200

    invoice_failed = client.post(
        "/billing/webhook",
        json={
            "id": "evt_invoice_failed_123",
            "type": "invoice.payment_failed",
            "data": {
                "object": {
                    "customer": "cus_webhook_replay_123",
                    "subscription": "sub_webhook_replay_123",
                    "amount_due": 120000,
                }
            },
        },
        headers={"stripe-signature": "t=123,v1=fake"},
    )
    assert invoice_failed.status_code == 200

    headers = {"x-session-token": session_token}
    ledger = client.get("/billing/ledger?limit=20", headers=headers)
    assert ledger.status_code == 200
    events = ledger.json()
    subscriptions = [event for event in events if event["event_type"] == "subscription"]
    assert len(subscriptions) == 1
    assert any(event["event_type"] == "invoice_paid" for event in events)
    assert any(event["event_type"] == "invoice_payment_failed" for event in events)

    state = client.get("/billing/subscription-state", headers=headers)
    assert state.status_code == 200
    assert state.json()["subscription_id"] == "sub_webhook_replay_123"
    assert state.json()["status"] == "past_due"
