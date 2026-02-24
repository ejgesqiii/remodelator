import { FormEvent } from "react";
import { CatalogItem, CatalogTreeNode, TemplateSummary } from "../types";
import { CatalogManagementSection } from "./catalog/CatalogManagementSection";
import { ExportSection } from "./catalog/ExportSection";
import { TemplateSection } from "./catalog/TemplateSection";

export type CatalogPanelProps = {
  busy: boolean;
  isSessionReady: boolean;
  hasSelectedEstimate: boolean;

  catalogQuery: string;
  setCatalogQuery: (value: string) => void;
  onCatalogSearch: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onReloadCatalogTree: () => void;

  catalogUpsertName: string;
  setCatalogUpsertName: (value: string) => void;
  catalogUpsertPrice: string;
  setCatalogUpsertPrice: (value: string) => void;
  catalogUpsertLabor: string;
  setCatalogUpsertLabor: (value: string) => void;
  catalogUpsertDescription: string;
  setCatalogUpsertDescription: (value: string) => void;
  onCatalogUpsert: () => void;

  catalogImportJson: string;
  setCatalogImportJson: (value: string) => void;
  onCatalogImport: () => void;
  catalogOpsOutput: string;

  catalogResults: CatalogItem[];
  onAddCatalogItem: (item: CatalogItem) => void;
  catalogTree: CatalogTreeNode[];

  templateName: string;
  setTemplateName: (value: string) => void;
  onSaveTemplate: () => void;
  selectedTemplateId: string;
  setSelectedTemplateId: (value: string) => void;
  templates: TemplateSummary[];
  onApplyTemplate: () => void;

  estimateExportPath: string;
  setEstimateExportPath: (value: string) => void;
  onExportEstimateJson: () => void;
  estimateExportResult: string;

  proposalPdfPath: string;
  setProposalPdfPath: (value: string) => void;
  onGenerateProposalPdf: () => void;
  proposalPdfResult: string;
};

export function CatalogPanel(props: CatalogPanelProps) {
  return (
    <section className="card">
      <h2>Catalog + Templates + Exports</h2>
      <p className="section-note">Manage catalog data and apply reusable templates to selected estimates.</p>
      <div className="two-col">
        <CatalogManagementSection
          busy={props.busy}
          isSessionReady={props.isSessionReady}
          hasSelectedEstimate={props.hasSelectedEstimate}
          catalogQuery={props.catalogQuery}
          setCatalogQuery={props.setCatalogQuery}
          onCatalogSearch={props.onCatalogSearch}
          onReloadCatalogTree={props.onReloadCatalogTree}
          catalogUpsertName={props.catalogUpsertName}
          setCatalogUpsertName={props.setCatalogUpsertName}
          catalogUpsertPrice={props.catalogUpsertPrice}
          setCatalogUpsertPrice={props.setCatalogUpsertPrice}
          catalogUpsertLabor={props.catalogUpsertLabor}
          setCatalogUpsertLabor={props.setCatalogUpsertLabor}
          catalogUpsertDescription={props.catalogUpsertDescription}
          setCatalogUpsertDescription={props.setCatalogUpsertDescription}
          onCatalogUpsert={props.onCatalogUpsert}
          catalogImportJson={props.catalogImportJson}
          setCatalogImportJson={props.setCatalogImportJson}
          onCatalogImport={props.onCatalogImport}
          catalogOpsOutput={props.catalogOpsOutput}
          catalogResults={props.catalogResults}
          onAddCatalogItem={props.onAddCatalogItem}
          catalogTree={props.catalogTree}
        />

        <div className="stack">
          <TemplateSection
            busy={props.busy}
            hasSelectedEstimate={props.hasSelectedEstimate}
            templateName={props.templateName}
            setTemplateName={props.setTemplateName}
            onSaveTemplate={props.onSaveTemplate}
            selectedTemplateId={props.selectedTemplateId}
            setSelectedTemplateId={props.setSelectedTemplateId}
            templates={props.templates}
            onApplyTemplate={props.onApplyTemplate}
          />

          <ExportSection
            busy={props.busy}
            hasSelectedEstimate={props.hasSelectedEstimate}
            estimateExportPath={props.estimateExportPath}
            setEstimateExportPath={props.setEstimateExportPath}
            onExportEstimateJson={props.onExportEstimateJson}
            estimateExportResult={props.estimateExportResult}
            proposalPdfPath={props.proposalPdfPath}
            setProposalPdfPath={props.setProposalPdfPath}
            onGenerateProposalPdf={props.onGenerateProposalPdf}
            proposalPdfResult={props.proposalPdfResult}
          />
        </div>
      </div>
    </section>
  );
}
