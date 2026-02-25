import { FormEvent } from "react";

import { apiRequest } from "./api";
import { Session } from "../types";

type RunAction = (label: string, action: () => Promise<void>) => Promise<void>;

type CreateAuthActionsOptions = {
  run: RunAction;
  registerEmail: string;
  registerPassword: string;
  registerName: string;
  loginEmail: string;
  loginPassword: string;
  persistSession: (next: Session | null) => void;
  clearWorkspace: () => void;
  resetProfileForm: () => void;
  pushLog: (line: string) => void;
  setLoginEmail: (value: string) => void;
  setRegisterPassword: (value: string) => void;
  setLoginPassword: (value: string) => void;
};

export function createAuthActions(options: CreateAuthActionsOptions) {
  const onRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await options.run("Register", async () => {
      const payload = await apiRequest<{ user_id: string; email: string; role?: string; session_token?: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: options.registerEmail,
          password: options.registerPassword,
          full_name: options.registerName,
        }),
      });
      if (!payload.session_token) {
        throw new Error("Registration succeeded but no session token was returned.");
      }
      options.persistSession({ email: payload.email, sessionToken: payload.session_token, role: payload.role ?? "user" });
      options.setLoginEmail(payload.email);
      options.setRegisterPassword("");
      options.setLoginPassword("");
    });
  };

  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await options.run("Login", async () => {
      const payload = await apiRequest<{ user_id: string; email: string; role?: string; session_token?: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: options.loginEmail, password: options.loginPassword }),
      });
      if (!payload.session_token) {
        throw new Error("Login succeeded but no session token was returned.");
      }
      options.persistSession({ email: payload.email, sessionToken: payload.session_token, role: payload.role ?? "user" });
      options.setLoginPassword("");
    });
  };

  const onLogout = () => {
    options.persistSession(null);
    options.clearWorkspace();
    options.resetProfileForm();
    options.pushLog("Logged out");
  };

  return {
    onRegister,
    onLogin,
    onLogout,
  };
}
