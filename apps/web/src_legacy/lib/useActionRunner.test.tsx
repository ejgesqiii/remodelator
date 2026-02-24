import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useActionRunner } from "./useActionRunner";

describe("useActionRunner", () => {
  it("marks success and logs completion", async () => {
    const { result } = renderHook(() => useActionRunner());

    await act(async () => {
      await result.current.run("Demo action", async () => {});
    });

    expect(result.current.busy).toBe(false);
    expect(result.current.actionStatus).toBe("Demo action: completed.");
    expect(result.current.actionStatusIsError).toBe(false);
    expect(result.current.logLines[0]).toContain("Demo action: OK");
  });

  it("marks error on thrown exception", async () => {
    const { result } = renderHook(() => useActionRunner());

    await act(async () => {
      await result.current.run("Fail action", async () => {
        throw new Error("boom");
      });
    });

    expect(result.current.busy).toBe(false);
    expect(result.current.actionStatusIsError).toBe(true);
    expect(result.current.actionStatus).toBe("Fail action: boom");
    expect(result.current.logLines[0]).toContain("Fail action: ERROR: boom");
  });
});
