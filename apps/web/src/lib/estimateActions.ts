import { apiRequest } from "./api";
import { Estimate } from "../types";

type RequestHeaders = Record<string, string>;

type RunWithEstimate = (
  label: string,
  noSessionMessage: string,
  noEstimateMessage: string,
  action: (headers: RequestHeaders, estimateId: string) => Promise<void>,
) => Promise<void>;

export type EstimateActionKind = "recalc" | "duplicate" | "version" | "status" | "unlock";

type CreateEstimateActionsOptions = {
  runWithEstimate: RunWithEstimate;
  statusTarget: string;
  setSelectedEstimateId: (id: string) => void;
  refreshEstimateViews: (estimateId: string | null) => Promise<void>;
};

export function createEstimateActions(options: CreateEstimateActionsOptions) {
  const onEstimateAction = async (kind: EstimateActionKind) => {
    await options.runWithEstimate(
      `Estimate ${kind}`,
      "Estimate action blocked: login required",
      "Estimate action blocked: select an estimate",
      async (headers, estimateId) => {
        let estimateToLoad = estimateId;
        if (kind === "status") {
          await apiRequest(
            `/estimates/${estimateId}/status`,
            {
              method: "POST",
              body: JSON.stringify({ status: options.statusTarget }),
            },
            headers,
          );
        } else if (kind === "unlock") {
          await apiRequest(`/estimates/${estimateId}/unlock`, { method: "POST" }, headers);
        } else {
          const result = await apiRequest<Estimate>(`/estimates/${estimateId}/${kind}`, { method: "POST" }, headers);
          if ((kind === "duplicate" || kind === "version") && result?.id) {
            estimateToLoad = result.id;
            options.setSelectedEstimateId(result.id);
          }
        }
        await options.refreshEstimateViews(estimateToLoad);
      },
    );
  };

  return {
    onEstimateAction,
  };
}
