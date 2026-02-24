import { describe, expect, it } from "vitest";
import { parseStoredSession } from "./session";

describe("parseStoredSession", () => {
  it("returns null when raw is empty", () => {
    expect(parseStoredSession(null)).toBeNull();
    expect(parseStoredSession("")).toBeNull();
  });

  it("returns null when json is invalid", () => {
    expect(parseStoredSession("{not-json}")).toBeNull();
  });

  it("returns null when required fields are missing", () => {
    expect(parseStoredSession(JSON.stringify({ email: "a@example.com" }))).toBeNull();
    expect(parseStoredSession(JSON.stringify({ sessionToken: "tok" }))).toBeNull();
  });

  it("returns parsed session with session token", () => {
    expect(parseStoredSession(JSON.stringify({ email: "a@example.com", sessionToken: "tok" }))).toEqual({
      email: "a@example.com",
      role: "user",
      sessionToken: "tok",
    });
  });

  it("preserves role when present", () => {
    expect(parseStoredSession(JSON.stringify({ email: "a@example.com", sessionToken: "tok", role: "admin" }))).toEqual({
      email: "a@example.com",
      role: "admin",
      sessionToken: "tok",
    });
  });

  it("returns null when sessionToken has invalid type", () => {
    expect(parseStoredSession(JSON.stringify({ email: "a@example.com", sessionToken: 123 }))).toBeNull();
  });
});
