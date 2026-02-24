import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAuthState } from "./useAuthState";

describe("useAuthState", () => {
  it("starts with empty auth form fields", () => {
    const { result } = renderHook(() => useAuthState());

    expect(result.current.registerEmail).toBe("");
    expect(result.current.registerPassword).toBe("");
    expect(result.current.registerName).toBe("");
    expect(result.current.loginEmail).toBe("");
    expect(result.current.loginPassword).toBe("");
  });
});
