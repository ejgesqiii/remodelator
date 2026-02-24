from __future__ import annotations

from sqlalchemy.orm import Session

from remodelator.application.billing_adapters import BillingCommand
from remodelator.application.billing_adapters import resolve_billing_adapter
from remodelator.config import get_settings


def execute_billing_command(session: Session, user_id: str, command: BillingCommand) -> dict[str, str]:
    adapter = resolve_billing_adapter(get_settings())
    return adapter.execute(session, user_id, command)
