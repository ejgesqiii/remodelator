type ProposalSectionProps = {
  proposalPreview: string;
};

export function ProposalSection(props: ProposalSectionProps) {
  const proposalLines = props.proposalPreview
    ? props.proposalPreview
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="stack">
      <h3>Proposal Preview</h3>
      <article className="result-block proposal-block">
        {proposalLines.length ? proposalLines.map((line, idx) => <p key={`${idx}-${line}`}>{line}</p>) : <p>No proposal rendered yet.</p>}
      </article>
    </div>
  );
}
