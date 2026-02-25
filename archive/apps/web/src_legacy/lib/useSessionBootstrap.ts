import { useEffect } from "react";

import { ActivePanel, Session } from "../types";

type UseSessionBootstrapOptions = {
  session: Session | null;
  clearWorkspace: () => void;
  resetProfileForm: () => void;
  setActivePanel: (value: ActivePanel | ((current: ActivePanel) => ActivePanel)) => void;
  loadCatalogTree: () => Promise<void>;
  loadLlmStatus: () => Promise<void>;
  loadBillingPolicy: () => Promise<void>;
  loadBillingProviderStatus: () => Promise<void>;
  loadEstimates: () => Promise<void>;
  loadBillingLedger: () => Promise<void>;
  loadSubscriptionState: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  loadProfile: () => Promise<void>;
  loadActivityAndAudit: () => Promise<void>;
  pushLog: (line: string) => void;
};

export function useSessionBootstrap(options: UseSessionBootstrapOptions): void {
  useEffect(() => {
    void (async () => {
      try {
        await Promise.all([
          options.loadCatalogTree(),
          options.loadLlmStatus(),
          options.loadBillingPolicy(),
          options.loadBillingProviderStatus(),
        ]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        options.pushLog(`Bootstrap load failed: ${message}`);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      if (!options.session) {
        options.clearWorkspace();
        options.resetProfileForm();
        options.setActivePanel("session");
        return;
      }
      options.setActivePanel((current) => (current === "session" ? "workspace" : current));
      try {
        await Promise.all([
          options.loadEstimates(),
          options.loadBillingLedger(),
          options.loadSubscriptionState(),
          options.loadTemplates(),
          options.loadProfile(),
          options.loadActivityAndAudit(),
        ]);
        options.pushLog(`Session loaded for ${options.session.email}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        options.pushLog(`Failed to load session data: ${message}`);
      }
    })();
  }, [options.session]);
}
