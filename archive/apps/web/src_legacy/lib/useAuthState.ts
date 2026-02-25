import { useState } from "react";

export function useAuthState() {
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  return {
    registerEmail,
    setRegisterEmail,
    registerPassword,
    setRegisterPassword,
    registerName,
    setRegisterName,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
  };
}
