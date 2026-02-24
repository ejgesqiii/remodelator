import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "./api";

describe("apiRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("includes request_id in thrown error message when available", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        detail: "conflict",
        error: { code: "conflict", message: "Operation is already running", status: 409 },
        request_id: "req-123",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/admin/demo-reset", { method: "POST" })).rejects.toThrow(
      "Operation is already running (request_id: req-123)"
    );
  });

  it("falls back to HTTP status when payload parsing fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => {
        throw new Error("bad json");
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/pricing/llm/live", { method: "POST" })).rejects.toThrow("HTTP 503");
  });
});
