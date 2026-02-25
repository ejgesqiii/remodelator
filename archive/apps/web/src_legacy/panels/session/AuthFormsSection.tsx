import { FormEvent } from "react";

type AuthFormsSectionProps = {
  busy: boolean;
  registerEmail: string;
  setRegisterEmail: (value: string) => void;
  registerPassword: string;
  setRegisterPassword: (value: string) => void;
  registerName: string;
  setRegisterName: (value: string) => void;
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  onRegister: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onLogin: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onLogout: () => void;
};

export function AuthFormsSection(props: AuthFormsSectionProps) {
  return (
    <div className="stack">
      <form onSubmit={props.onRegister} className="stack">
        <h3>Register</h3>
        <input value={props.registerEmail} onChange={(e) => props.setRegisterEmail(e.target.value)} placeholder="Email" required />
        <input
          value={props.registerPassword}
          onChange={(e) => props.setRegisterPassword(e.target.value)}
          type="password"
          placeholder="Password"
          required
        />
        <input value={props.registerName} onChange={(e) => props.setRegisterName(e.target.value)} placeholder="Full name" />
        <button disabled={props.busy}>Create User</button>
      </form>
      <form onSubmit={props.onLogin} className="stack">
        <h3>Login</h3>
        <input value={props.loginEmail} onChange={(e) => props.setLoginEmail(e.target.value)} placeholder="Email" required />
        <input
          value={props.loginPassword}
          onChange={(e) => props.setLoginPassword(e.target.value)}
          type="password"
          placeholder="Password"
          required
        />
        <button disabled={props.busy}>Login</button>
        <button type="button" onClick={props.onLogout} className="ghost" disabled={props.busy}>
          Logout
        </button>
        <p className="section-note">
          Forgot password is intentionally deferred for this phase and will be enabled once email delivery is implemented.
        </p>
      </form>
    </div>
  );
}
