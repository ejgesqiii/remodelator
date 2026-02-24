type AppHeroProps = {
  sessionEmail: string | null;
  estimatesCount: number;
  currentTotalLabel: string;
  actionStatus: string;
  actionStatusIsError: boolean;
  llmBlockerMessage: string | null;
  billingBlockerMessage: string | null;
};

export function AppHero(props: AppHeroProps) {
  return (
    <header className="hero">
      <h1>Remodelator vNext Web Console</h1>
      <p>Client-ready local product demo with full workflows, clear outputs, and deterministic backend logic.</p>
      <div className="hero-meta">
        <div className="badge">{props.sessionEmail ? `Signed in: ${props.sessionEmail}` : "No active session"}</div>
        <div className="badge alt">{`Estimates: ${props.estimatesCount}`}</div>
        <div className="badge alt">{props.currentTotalLabel}</div>
      </div>
      <div className={`status-banner ${props.actionStatusIsError ? "error" : ""}`}>{props.actionStatus}</div>
      {props.llmBlockerMessage ? <div className="status-banner blocker">{`LLM dependency issue: ${props.llmBlockerMessage}`}</div> : null}
      {props.billingBlockerMessage ? (
        <div className="status-banner blocker">{`Billing dependency issue: ${props.billingBlockerMessage}`}</div>
      ) : null}
    </header>
  );
}
