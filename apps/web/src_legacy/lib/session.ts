import { Session } from "../types";
import { readStorage } from "./storage";

export function parseStoredSession(raw: string | null): Session | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (!parsed.email || !parsed.sessionToken) {
      return null;
    }
    if (typeof parsed.sessionToken !== "string") {
      return null;
    }
    return {
      email: parsed.email,
      sessionToken: parsed.sessionToken,
      role: typeof parsed.role === "string" ? parsed.role : "user",
    };
  } catch {
    return null;
  }
}

export function loadStoredSession(storageKey: string): Session | null {
  return parseStoredSession(readStorage(storageKey));
}
