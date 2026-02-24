import { useCallback, useState } from "react";

type RunAction = () => Promise<void>;

type UseActionRunnerResult = {
  busy: boolean;
  actionStatus: string;
  actionStatusIsError: boolean;
  logLines: string[];
  pushLog: (message: string) => void;
  clearLogs: () => void;
  run: (label: string, action: RunAction) => Promise<void>;
};

export function useActionRunner(initialStatus = "Ready."): UseActionRunnerResult {
  const [busy, setBusy] = useState(false);
  const [actionStatus, setActionStatus] = useState(initialStatus);
  const [actionStatusIsError, setActionStatusIsError] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);

  const pushLog = useCallback((message: string) => {
    const stamp = new Date().toISOString();
    setLogLines((prev) => [`${stamp} ${message}`, ...prev].slice(0, 100));
  }, []);

  const clearLogs = useCallback(() => {
    setLogLines([]);
  }, []);

  const run = useCallback(
    async (label: string, action: RunAction) => {
      setBusy(true);
      setActionStatusIsError(false);
      setActionStatus(`${label}: running...`);
      try {
        await action();
        pushLog(`${label}: OK`);
        setActionStatus(`${label}: completed.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        pushLog(`${label}: ERROR: ${message}`);
        setActionStatusIsError(true);
        setActionStatus(`${label}: ${message}`);
      } finally {
        setBusy(false);
      }
    },
    [pushLog],
  );

  return {
    busy,
    actionStatus,
    actionStatusIsError,
    logLines,
    pushLog,
    clearLogs,
    run,
  };
}
