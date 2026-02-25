type RequestHeaders = Record<string, string>;

type RunAction = (label: string, action: () => Promise<void>) => Promise<void>;

type GuardedRunnerOptions = {
  isSessionReady: boolean;
  selectedEstimateId: string | null;
  selectedLineItemId: string;
  pushLog: (line: string) => void;
  run: RunAction;
  authHeaders: () => RequestHeaders;
};

export function createGuardedRunners(options: GuardedRunnerOptions) {
  const runWithSession = async (
    label: string,
    blockedMessage: string,
    action: (headers: RequestHeaders) => Promise<void>,
  ) => {
    if (!options.isSessionReady) {
      options.pushLog(blockedMessage);
      return;
    }
    await options.run(label, async () => {
      await action(options.authHeaders());
    });
  };

  const runWithEstimate = async (
    label: string,
    noSessionMessage: string,
    noEstimateMessage: string,
    action: (headers: RequestHeaders, estimateId: string) => Promise<void>,
  ) => {
    await runWithSession(label, noSessionMessage, async (headers) => {
      if (!options.selectedEstimateId) {
        options.pushLog(noEstimateMessage);
        return;
      }
      await action(headers, options.selectedEstimateId);
    });
  };

  const runWithEstimateLine = async (
    label: string,
    noSessionMessage: string,
    noEstimateMessage: string,
    noLineMessage: string,
    action: (headers: RequestHeaders, estimateId: string, lineItemId: string) => Promise<void>,
  ) => {
    await runWithEstimate(label, noSessionMessage, noEstimateMessage, async (headers, estimateId) => {
      if (!options.selectedLineItemId) {
        options.pushLog(noLineMessage);
        return;
      }
      await action(headers, estimateId, options.selectedLineItemId);
    });
  };

  return {
    runWithSession,
    runWithEstimate,
    runWithEstimateLine,
  };
}
