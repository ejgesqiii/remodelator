type ExportSectionProps = {
  busy: boolean;
  hasSelectedEstimate: boolean;
  estimateExportPath: string;
  setEstimateExportPath: (value: string) => void;
  onExportEstimateJson: () => void;
  estimateExportResult: string;
  proposalPdfPath: string;
  setProposalPdfPath: (value: string) => void;
  onGenerateProposalPdf: () => void;
  proposalPdfResult: string;
};

export function ExportSection(props: ExportSectionProps) {
  const estimateExportSummary = props.estimateExportResult || "No estimate export run.";
  const proposalPdfSummary = props.proposalPdfResult || "No proposal PDF run.";

  return (
    <>
      <h3>Estimate/Proposal Export</h3>
      <div className="inline-grid">
        <input
          value={props.estimateExportPath}
          onChange={(e) => props.setEstimateExportPath(e.target.value)}
          placeholder="Estimate export output path"
        />
        <button disabled={props.busy || !props.hasSelectedEstimate} onClick={props.onExportEstimateJson}>
          Export Estimate
        </button>
      </div>
      <div className="result-block">{estimateExportSummary}</div>

      <div className="inline-grid">
        <input value={props.proposalPdfPath} onChange={(e) => props.setProposalPdfPath(e.target.value)} placeholder="Proposal PDF output path" />
        <button disabled={props.busy || !props.hasSelectedEstimate} onClick={props.onGenerateProposalPdf}>
          Generate Proposal PDF
        </button>
      </div>
      <div className="result-block">{proposalPdfSummary}</div>
    </>
  );
}
