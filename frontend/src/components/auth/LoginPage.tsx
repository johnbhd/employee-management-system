"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useState } from "react";

import { Icon } from "@/components/ui/Icon";

type LoginRole = "employee" | "admin" | "hr";

type DemoAccount = {
  password: string;
  role: LoginRole;
  redirectTo: "/employee/dashboard" | "/admin/dashboard" | "/hr/dashboard";
};

type LoginErrorField = "username" | "password" | "credentials" | null;

const demoAccounts: Record<string, DemoAccount> = {
  "aujsc.admin": {
    password: "admin123",
    role: "admin",
    redirectTo: "/admin/dashboard",
  },
  "aujsc.hr": {
    password: "hr123",
    role: "hr",
    redirectTo: "/hr/dashboard",
  },
  employee1: {
    password: "employee123",
    role: "employee",
    redirectTo: "/employee/dashboard",
  },
};

export function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<LoginErrorField>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const usernameHasError = errorField === "username" || errorField === "credentials";
  const passwordHasError = errorField === "password" || errorField === "credentials";

  function clearValidationError() {
    setErrorMessage("");
    setErrorField(null);
  }

  function handleUsernameChange(event: ChangeEvent<HTMLInputElement>) {
    setUsername(event.target.value);
    clearValidationError();
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
    clearValidationError();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername) {
      setErrorMessage("Please enter your username.");
      setErrorField("username");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      setErrorField("password");
      return;
    }

    const account = demoAccounts[normalizedUsername];

    if (!account || account.password !== password) {
      setErrorMessage("Invalid username or password.");
      setErrorField("credentials");
      return;
    }

    setErrorMessage("");
    setErrorField(null);
    setIsSubmitting(true);
    sessionStorage.setItem("prototypeRole", account.role);
    sessionStorage.setItem("prototypeUsername", normalizedUsername);
    router.push(account.redirectTo);
  }

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  }

  return (
    <main className="page login-page">
      <section className="brand-side" aria-label="Arellano University branding">
        <Image className="brand-logo" src="/images/new-au-logo.png" alt="Arellano University Logo" width={100} height={100} priority />
        <h1 className="brand-title">Integrated HRIS, QR Attendance,<br />Payroll, and Accounting System</h1>
        <div className="brand-divider" />
        <p className="brand-subtitle">Employee Access Portal</p>
        <div className="brand-address">
          <Icon name="location" />
          <span>Arellano University – Juan Sumulong Campus<br />2600 Legarda St., Sampaloc, Manila</span>
        </div>
      </section>

      <section className="login-side" aria-label="Employee login">
        <div className="container">
          <div className="brand-panel">
            <Image className="logo" src="/images/new-au-logo.png" alt="Arellano University Logo" width={80} height={80} priority />
            <h2>Arellano University</h2>
            <p className="subtitle">Employee Portal</p>
          </div>

          <div className="form-panel">
            <form id="loginform" onSubmit={handleSubmit} noValidate>
              <div className="form">
                <label htmlFor="username">Username</label>
                <div className={usernameHasError ? "input-wrap is-error" : "input-wrap"}>
                  <Icon name="user" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={username}
                    onChange={handleUsernameChange}
                    autoComplete="username"
                    placeholder="Enter your username"
                    aria-invalid={usernameHasError}
                    aria-describedby={errorMessage ? "login-error" : undefined}
                    required
                  />
                </div>
              </div>

              <div className="form">
                <label htmlFor="password">Password</label>
                <div className={passwordHasError ? "input-wrap is-error" : "input-wrap"}>
                  <Icon name="lock" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={passwordHasError}
                    aria-describedby={errorMessage ? "login-error" : undefined}
                    required
                  />
                </div>

                <div className="row-between">
                  <label className="remember" htmlFor="showPassword">
                    <input type="checkbox" id="showPassword" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
                    Show password
                  </label>
                  <label className="remember" htmlFor="rememberMe">
                    <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                    Remember me
                  </label>
                </div>

                {errorMessage ? <p id="login-error" className="login-error" role="alert">{errorMessage}</p> : null}

                <div className="actions">
                  <button type="submit" className="btn-primary btn-full" disabled={isSubmitting}>
                    {isSubmitting ? "Logging in..." : "Login"}
                  </button>
                  <button type="button" className="auth-link" onClick={() => showFeedback("Password recovery is not connected in this prototype.")}><Icon name="key" /> Forgot password</button>
                  <button type="button" className="auth-link" onClick={() => showFeedback("IT support contact is a prototype action.")}><Icon name="comment" /> Contact IT Support</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
      <span className="sr-only" aria-live="polite">{feedback}</span>
    </main>
  );
}
