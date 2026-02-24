import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EstimateLifecycleActions } from "./EstimateLifecycleActions";
import { LineItemActions } from "./LineItemActions";
import { LlmPricingAssist } from "./LlmPricingAssist";

describe("workspace section components", () => {
  it("renders LLM blocker details when provider is not ready", () => {
    render(
      <LlmPricingAssist
        busy={false}
        selectedLineItemId="line-1"
        llmStatus="Provider check failed"
        llmReadyForLive={false}
        llmBlockerReason="OpenRouter key missing"
        onRefreshLlmStatus={vi.fn()}
        llmContext=""
        setLlmContext={vi.fn()}
        llmSuggestedPrice=""
        setLlmSuggestedPrice={vi.fn()}
        llmSuggestion={null}
        onSuggestLlm={vi.fn()}
        onApplyLlmSuggestion={vi.fn()}
      />,
    );

    expect(screen.getByText("Provider check failed")).toBeInTheDocument();
    expect(screen.getByText(/LLM BLOCKER: OpenRouter key missing/i)).toBeInTheDocument();
    expect(screen.getByText("No LLM suggestion yet.")).toBeInTheDocument();
  });

  it("triggers lifecycle action callbacks", () => {
    const onEstimateAction = vi.fn();
    render(
      <EstimateLifecycleActions
        busy={false}
        selectedEstimateId="est-1"
        statusTarget="draft"
        setStatusTarget={vi.fn()}
        onEstimateAction={onEstimateAction}
      />,
    );

    fireEvent.click(screen.getByText("Recalc"));
    fireEvent.click(screen.getByText("Set Status"));

    expect(onEstimateAction).toHaveBeenNthCalledWith(1, "recalc");
    expect(onEstimateAction).toHaveBeenNthCalledWith(2, "status");
  });

  it("triggers line-item action callbacks", () => {
    const onReorderSelectedLine = vi.fn();
    const onGroupLineItems = vi.fn();
    render(
      <LineItemActions
        busy={false}
        selectedEstimateId="est-1"
        selectedLineItemId="line-1"
        editQuantity="1"
        setEditQuantity={vi.fn()}
        editUnitPrice="10"
        setEditUnitPrice={vi.fn()}
        editLaborHours="0"
        setEditLaborHours={vi.fn()}
        editItemMarkupPct="0"
        setEditItemMarkupPct={vi.fn()}
        editDiscountValue="0"
        setEditDiscountValue={vi.fn()}
        editDiscountIsPercent={false}
        setEditDiscountIsPercent={vi.fn()}
        editGroupName=""
        setEditGroupName={vi.fn()}
        onUpdateSelectedLine={vi.fn()}
        onRemoveSelectedLine={vi.fn()}
        onReorderSelectedLine={onReorderSelectedLine}
        lineGroupName=""
        setLineGroupName={vi.fn()}
        onGroupLineItems={onGroupLineItems}
      />,
    );

    fireEvent.click(screen.getByText("Move Down"));
    fireEvent.click(screen.getByText("Group All Lines"));

    expect(onReorderSelectedLine).toHaveBeenCalledWith(1);
    expect(onGroupLineItems).toHaveBeenCalledWith("all");
  });
});
