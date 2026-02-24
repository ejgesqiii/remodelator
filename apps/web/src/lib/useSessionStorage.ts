import { useState } from "react";

import { loadStoredSession } from "./session";
import { readStorage, removeStorage, writeStorage } from "./storage";
import { Session } from "../types";

const SESSION_KEY = "remodelator_web_session";
const ADMIN_KEY_STORAGE = "remodelator_web_admin_key";

export function useSessionStorage(defaultAdminKey: string) {
  const [session, setSession] = useState<Session | null>(() => loadStoredSession(SESSION_KEY));
  const [adminKey, setAdminKey] = useState(() => readStorage(ADMIN_KEY_STORAGE) ?? defaultAdminKey);

  const persistSession = (next: Session | null) => {
    setSession(next);
    if (next) {
      writeStorage(SESSION_KEY, JSON.stringify(next));
    } else {
      removeStorage(SESSION_KEY);
    }
  };

  const persistAdminKey = () => writeStorage(ADMIN_KEY_STORAGE, adminKey);

  return {
    session,
    persistSession,
    adminKey,
    setAdminKey,
    persistAdminKey,
  };
}
