import { LlmProviderStatus } from "../types";

export function formatCurrency(value: string): string {
  const asNumber = Number(value);
  if (Number.isNaN(asNumber)) {
    return value;
  }
  return asNumber.toFixed(2);
}

export function formatLlmStatus(status: LlmProviderStatus): string {
  const liveState = status.ready_for_live ? "Live ready" : "BLOCKER: OpenRouter not configured";
  const blocker = status.blocker_reason ? ` | blocker=${status.blocker_reason}` : "";
  return `LLM: ${liveState} | provider=${status.provider} | model=${status.model} | mode=${status.live_mode} | retries=${status.max_retries} | max_change_pct=${status.max_price_change_pct}${blocker}`;
}

export function decimalOrZero(value: string): string {
  const trimmed = value.trim();
  return trimmed === "" ? "0" : trimmed;
}
