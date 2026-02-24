import { apiRequest } from "./api";

type RequestHeaders = Record<string, string>;

type RunWithEstimate = (
  label: string,
  noSessionMessage: string,
  noEstimateMessage: string,
  action: (headers: RequestHeaders, estimateId: string) => Promise<void>,
) => Promise<void>;

type CreateProposalActionsOptions = {
  runWithEstimate: RunWithEstimate;
  proposalPdfPath: string;
  estimateExportPath: string;
  setProposalPreview: (value: string) => void;
  setProposalPdfResult: (value: string) => void;
  setProposalPdfPath: (value: string) => void;
  setEstimateExportResult: (value: string) => void;
  setEstimateExportPath: (value: string) => void;
  setActivePanel: (panel: "output") => void;
};

export function createProposalActions(options: CreateProposalActionsOptions) {
  const onRenderProposal = async () => {
    await options.runWithEstimate(
      "Render proposal",
      "Proposal render blocked: login required",
      "Proposal render blocked: select an estimate",
      async (headers, estimateId) => {
        const result = await apiRequest<{ rendered: string }>(
          `/proposals/${estimateId}/render`,
          { method: "GET" },
          headers,
        );
        options.setProposalPreview(result.rendered);
        options.setActivePanel("output");
      },
    );
  };

  const onGenerateProposalPdf = async () => {
    await options.runWithEstimate(
      "Generate proposal PDF",
      "Proposal PDF blocked: login required",
      "Proposal PDF blocked: select an estimate",
      async (headers, estimateId) => {
        const outputPath = options.proposalPdfPath.trim() || `data/demo_outputs/proposal_${estimateId}.pdf`;
        const result = await apiRequest<Record<string, string>>(
          `/proposals/${estimateId}/pdf`,
          {
            method: "POST",
            body: JSON.stringify({ output_path: outputPath }),
          },
          headers,
        );
        options.setProposalPdfResult(`Proposal PDF generated at: ${result.path ?? outputPath}`);
        if (!options.proposalPdfPath.trim()) {
          options.setProposalPdfPath(outputPath);
        }
      },
    );
  };

  const onExportEstimateJson = async () => {
    await options.runWithEstimate(
      "Export estimate JSON",
      "Estimate export blocked: login required",
      "Estimate export blocked: select an estimate",
      async (headers, estimateId) => {
        const outputPath = options.estimateExportPath.trim() || `data/demo_outputs/estimate_${estimateId}.json`;
        const result = await apiRequest<Record<string, string>>(
          `/estimates/${estimateId}/export`,
          {
            method: "POST",
            body: JSON.stringify({ output_path: outputPath }),
          },
          headers,
        );
        options.setEstimateExportResult(`Estimate export written to: ${result.path ?? outputPath}`);
        if (!options.estimateExportPath.trim()) {
          options.setEstimateExportPath(outputPath);
        }
      },
    );
  };

  return {
    onRenderProposal,
    onGenerateProposalPdf,
    onExportEstimateJson,
  };
}
