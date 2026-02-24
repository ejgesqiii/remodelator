export function readStorage(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined" && typeof localStorage.getItem === "function") {
      return localStorage.getItem(key);
    }
  } catch {
    // Ignore storage access failure in restricted contexts.
  }
  return null;
}

export function writeStorage(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined" && typeof localStorage.setItem === "function") {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage access failure in restricted contexts.
  }
}

export function removeStorage(key: string): void {
  try {
    if (typeof localStorage !== "undefined" && typeof localStorage.removeItem === "function") {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access failure in restricted contexts.
  }
}
