from __future__ import annotations

from remodelator.config import get_settings

API_LIMIT_MIN = 1
API_LIMIT_MAX = max(API_LIMIT_MIN, get_settings().api_limit_max)

DEFAULT_AUDIT_LIMIT = 50
DEFAULT_CATALOG_SEARCH_LIMIT = 20
DEFAULT_TEMPLATE_LIST_LIMIT = 100
DEFAULT_BILLING_LEDGER_LIMIT = 50
DEFAULT_ADMIN_LIMIT = 200
