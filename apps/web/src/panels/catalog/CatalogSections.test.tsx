import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CatalogManagementSection } from "./CatalogManagementSection";
import { ExportSection } from "./ExportSection";

describe("catalog section components", () => {
  it("renders catalog tree empty state and fires import action", () => {
    const onCatalogImport = vi.fn();
    render(
      <CatalogManagementSection
        busy={false}
        isSessionReady={true}
        hasSelectedEstimate={true}
        catalogQuery=""
        setCatalogQuery={vi.fn()}
        onCatalogSearch={vi.fn()}
        onReloadCatalogTree={vi.fn()}
        catalogUpsertName=""
        setCatalogUpsertName={vi.fn()}
        catalogUpsertPrice=""
        setCatalogUpsertPrice={vi.fn()}
        catalogUpsertLabor=""
        setCatalogUpsertLabor={vi.fn()}
        catalogUpsertDescription=""
        setCatalogUpsertDescription={vi.fn()}
        onCatalogUpsert={vi.fn()}
        catalogImportJson="[]"
        setCatalogImportJson={vi.fn()}
        onCatalogImport={onCatalogImport}
        catalogOpsOutput=""
        catalogResults={[]}
        onAddCatalogItem={vi.fn()}
        catalogTree={[]}
      />,
    );

    fireEvent.click(screen.getByText("Import Catalog JSON"));
    expect(onCatalogImport).toHaveBeenCalled();
    expect(screen.getByText("No catalog nodes loaded.")).toBeInTheDocument();
  });

  it("shows default export summaries", () => {
    render(
      <ExportSection
        busy={false}
        hasSelectedEstimate={true}
        estimateExportPath=""
        setEstimateExportPath={vi.fn()}
        onExportEstimateJson={vi.fn()}
        estimateExportResult=""
        proposalPdfPath=""
        setProposalPdfPath={vi.fn()}
        onGenerateProposalPdf={vi.fn()}
        proposalPdfResult=""
      />,
    );

    expect(screen.getByText("No estimate export run.")).toBeInTheDocument();
    expect(screen.getByText("No proposal PDF run.")).toBeInTheDocument();
  });
});
