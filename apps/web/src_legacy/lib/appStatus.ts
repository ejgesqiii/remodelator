import type { CatalogTreeNode } from "../types";
import { DEFAULT_EXTERNAL_BLOCKERS, DEFAULT_QUICKSTART_ROOM } from "./defaults";

type ExternalBlockersInput = {
  showLlmBlockerBanner: boolean;
  llmBlockerMessage: string;
  billingBlockerMessage: string | null;
};

export function buildQuickstartCatalogNodes(catalogTree: CatalogTreeNode[], fallbackName: string): string[] {
  const names = catalogTree
    .filter((node) => node.items.length > 0)
    .map((node) => node.name)
    .filter((name) => Boolean(name.trim()));
  const uniqueSorted = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  const normalizedFallback = fallbackName.trim() || DEFAULT_QUICKSTART_ROOM;
  return uniqueSorted.length ? uniqueSorted : [normalizedFallback];
}

export function isQuickstartCatalogReady(catalogTree: CatalogTreeNode[]): boolean {
  return catalogTree.some((node) => node.items.length > 0);
}

export function buildExternalBlockers(input: ExternalBlockersInput): string[] {
  const blockers = [...DEFAULT_EXTERNAL_BLOCKERS];
  if (input.showLlmBlockerBanner) {
    blockers.unshift(`OpenRouter blocker: ${input.llmBlockerMessage}`);
  }
  if (input.billingBlockerMessage) {
    blockers.unshift(`Stripe blocker: ${input.billingBlockerMessage}`);
  }
  return blockers;
}
