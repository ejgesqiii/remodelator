import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadStoredSession } from "./session";
import { readStorage, removeStorage, writeStorage } from "./storage";
import { useSessionStorage } from "./useSessionStorage";

vi.mock("./session", () => ({
  loadStoredSession: vi.fn(),
}));

vi.mock("./storage", () => ({
  readStorage: vi.fn(),
  removeStorage: vi.fn(),
  writeStorage: vi.fn(),
}));

describe("useSessionStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads session and admin key from storage", () => {
    vi.mocked(loadStoredSession).mockReturnValue({ email: "demo@example.com", sessionToken: "token-1", role: "admin" });
    vi.mocked(readStorage).mockReturnValue("custom-admin");

    const { result } = renderHook(() => useSessionStorage("local-admin-key"));

    expect(result.current.session).toEqual({ email: "demo@example.com", sessionToken: "token-1", role: "admin" });
    expect(result.current.adminKey).toBe("custom-admin");
  });

  it("persists and clears session values", () => {
    vi.mocked(loadStoredSession).mockReturnValue(null);
    vi.mocked(readStorage).mockReturnValue(null);
    const { result } = renderHook(() => useSessionStorage("local-admin-key"));

    act(() => {
      result.current.persistSession({ email: "demo@example.com", sessionToken: "token-2", role: "user" });
    });
    expect(writeStorage).toHaveBeenCalledWith(
      "remodelator_web_session",
      JSON.stringify({ email: "demo@example.com", sessionToken: "token-2", role: "user" }),
    );

    act(() => {
      result.current.persistSession(null);
    });
    expect(removeStorage).toHaveBeenCalledWith("remodelator_web_session");
  });
});
