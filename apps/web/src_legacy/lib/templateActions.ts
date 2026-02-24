import { apiRequest } from "./api";

type RequestHeaders = Record<string, string>;

type RunWithEstimate = (
  label: string,
  noSessionMessage: string,
  noEstimateMessage: string,
  action: (headers: RequestHeaders, estimateId: string) => Promise<void>,
) => Promise<void>;

type CreateTemplateActionsOptions = {
  runWithEstimate: RunWithEstimate;
  templateName: string;
  selectedTemplateId: string;
  pushLog: (line: string) => void;
  loadTemplates: () => Promise<void>;
  refreshEstimateViews: (estimateId: string | null) => Promise<void>;
  setActivePanel: (panel: "workspace") => void;
};

export function createTemplateActions(options: CreateTemplateActionsOptions) {
  const onSaveTemplate = async () => {
    await options.runWithEstimate(
      "Save template",
      "Template save blocked: login required",
      "Template save blocked: select an estimate",
      async (headers, estimateId) => {
        const result = await apiRequest<{ template_id: string; name: string }>(
          "/templates/save",
          {
            method: "POST",
            body: JSON.stringify({ estimate_id: estimateId, name: options.templateName }),
          },
          headers,
        );
        options.pushLog(`Template saved: ${result.name}`);
        await options.loadTemplates();
      },
    );
  };

  const onApplyTemplate = async () => {
    if (!options.selectedTemplateId) {
      options.pushLog("Template apply blocked: select estimate and template");
      return;
    }
    await options.runWithEstimate(
      "Apply template",
      "Template apply blocked: login required",
      "Template apply blocked: select estimate and template",
      async (headers, estimateId) => {
        await apiRequest(
          "/templates/apply",
          {
            method: "POST",
            body: JSON.stringify({ template_id: options.selectedTemplateId, estimate_id: estimateId }),
          },
          headers,
        );
        await options.refreshEstimateViews(estimateId);
        options.setActivePanel("workspace");
      },
    );
  };

  return {
    onSaveTemplate,
    onApplyTemplate,
  };
}
