import { FormEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "./api";
import { createAuthActions } from "./authActions";

vi.mock("./api", () => ({
  apiRequest: vi.fn(),
}));

type AuthActionOptions = Parameters<typeof createAuthActions>[0];

function buildOptions(overrides: Partial<AuthActionOptions> = {}): AuthActionOptions {
  return {
    run: vi.fn(async (_label, action) => {
      await action();
    }),
    registerEmail: "new@example.com",
    registerPassword: "Password123!",
    registerName: "New User",
    loginEmail: "new@example.com",
    loginPassword: "Password123!",
    persistSession: vi.fn(),
    clearWorkspace: vi.fn(),
    resetProfileForm: vi.fn(),
    pushLog: vi.fn(),
    setLoginEmail: vi.fn(),
    setRegisterPassword: vi.fn(),
    setLoginPassword: vi.fn(),
    ...overrides,
  };
}

describe("createAuthActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers and persists the returned session token", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({
      user_id: "usr-1",
      email: "new@example.com",
      session_token: "session-token-1",
    });
    const options = buildOptions();
    const actions = createAuthActions(options);
    const event = { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;

    await actions.onRegister(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockedApiRequest).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "new@example.com",
        password: "Password123!",
        full_name: "New User",
      }),
    });
    expect(options.persistSession).toHaveBeenCalledWith({
      email: "new@example.com",
      role: "user",
      sessionToken: "session-token-1",
    });
    expect(options.setLoginEmail).toHaveBeenCalledWith("new@example.com");
    expect(options.setRegisterPassword).toHaveBeenCalledWith("");
    expect(options.setLoginPassword).toHaveBeenCalledWith("");
  });

  it("logs in and persists session token", async () => {
    const mockedApiRequest = vi.mocked(apiRequest);
    mockedApiRequest.mockResolvedValue({
      user_id: "usr-1",
      email: "new@example.com",
      session_token: "session-token-2",
    });
    const options = buildOptions();
    const actions = createAuthActions(options);
    const event = { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;

    await actions.onLogin(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockedApiRequest).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "new@example.com",
        password: "Password123!",
      }),
    });
    expect(options.persistSession).toHaveBeenCalledWith({
      email: "new@example.com",
      role: "user",
      sessionToken: "session-token-2",
    });
    expect(options.setLoginPassword).toHaveBeenCalledWith("");
  });

  it("logs out and clears local workspace/profile state", () => {
    const options = buildOptions();
    const actions = createAuthActions(options);

    actions.onLogout();

    expect(options.persistSession).toHaveBeenCalledWith(null);
    expect(options.clearWorkspace).toHaveBeenCalled();
    expect(options.resetProfileForm).toHaveBeenCalled();
    expect(options.pushLog).toHaveBeenCalledWith("Logged out");
  });
});
