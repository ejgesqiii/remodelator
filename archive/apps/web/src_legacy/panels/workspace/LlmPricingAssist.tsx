import { LlmSuggestion } from "../../types";

type LlmPricingAssistProps = {
  busy: boolean;
  selectedLineItemId: string;
  llmStatus: string;
  llmReadyForLive: boolean;
  llmBlockerReason: string;
  onRefreshLlmStatus: () => void;
  llmContext: string;
  setLlmContext: (value: string) => void;
  llmSuggestedPrice: string;
  setLlmSuggestedPrice: (value: string) => void;
  llmSuggestion: LlmSuggestion | null;
  onSuggestLlm: () => void;
  onApplyLlmSuggestion: () => void;
};

export function LlmPricingAssist(props: LlmPricingAssistProps) {
  return (
    <div className="stack detail-body">
      <div className="inline-grid">
        <div className="info-strip">{props.llmStatus}</div>
        <button type="button" disabled={props.busy} onClick={props.onRefreshLlmStatus}>
          Refresh LLM Status
        </button>
      </div>
      {!props.llmReadyForLive ? (
        <div className="info-strip">{`LLM BLOCKER: ${props.llmBlockerReason || "OpenRouter is not ready."}`}</div>
      ) : null}
      <div className="inline-grid">
        <div className="info-strip">Mode: OpenRouter Live (required)</div>
        <button
          type="button"
          disabled={props.busy || !props.llmReadyForLive || !props.selectedLineItemId}
          onClick={props.onSuggestLlm}
        >
          Suggest Price
        </button>
      </div>
      <input value={props.llmContext} onChange={(e) => props.setLlmContext(e.target.value)} placeholder="LLM context" />
      <div className="inline-grid">
        <input
          value={props.llmSuggestedPrice}
          onChange={(e) => props.setLlmSuggestedPrice(e.target.value)}
          placeholder="Suggested unit price"
        />
        <button
          type="button"
          disabled={props.busy || !props.selectedLineItemId || !props.llmSuggestedPrice.trim()}
          onClick={props.onApplyLlmSuggestion}
        >
          Apply Suggestion
        </button>
      </div>
      <div className="result-block">
        {props.llmSuggestion ? (
          <div className="stack">
            <div className="stat-grid">
              <div className="stat-cell">
                <span>Item</span>
                <strong>{props.llmSuggestion.item_name}</strong>
              </div>
              <div className="stat-cell">
                <span>Current unit price</span>
                <strong>{`$${props.llmSuggestion.current_unit_price}`}</strong>
              </div>
              <div className="stat-cell">
                <span>Suggested unit price</span>
                <strong>{`$${props.llmSuggestion.suggested_unit_price}`}</strong>
              </div>
              <div className="stat-cell">
                <span>Mode</span>
                <strong>{props.llmSuggestion.mode ?? "live"}</strong>
              </div>
              {props.llmSuggestion.provider ? (
                <div className="stat-cell">
                  <span>Provider</span>
                  <strong>{props.llmSuggestion.provider}</strong>
                </div>
              ) : null}
              {props.llmSuggestion.model ? (
                <div className="stat-cell">
                  <span>Model</span>
                  <strong>{props.llmSuggestion.model}</strong>
                </div>
              ) : null}
              {props.llmSuggestion.confidence ? (
                <div className="stat-cell">
                  <span>Confidence</span>
                  <strong>{props.llmSuggestion.confidence}</strong>
                </div>
              ) : null}
            </div>
            {props.llmSuggestion.rationale ? <div className="info-strip">{`Rationale: ${props.llmSuggestion.rationale}`}</div> : null}
          </div>
        ) : (
          "No LLM suggestion yet."
        )}
      </div>
    </div>
  );
}
