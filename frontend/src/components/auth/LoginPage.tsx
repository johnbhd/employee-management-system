"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Icon } from "@/components/ui/Icon";

type LoginRole = "employee" | "admin";

const demoAccounts: Record<string, LoginRole> = {
  "employee@aujsc.edu.ph": "employee",
  "admin@aujsc.edu.ph": "admin",
};

export function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const role = demoAccounts[username.trim().toLowerCase()];

    if (!role || !password.trim()) {
      setError("Please enter a valid AU username and password.");
      return;
    }

    setError("");
    router.push(role === "employee" ? "/employee/dashboard" : "/admin/dashboard");
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
            <form id="loginform" onSubmit={handleSubmit}>
              <div className="form">
                <label htmlFor="username">Username</label>
                <div className="input-wrap">
                  <Icon name="user" />
                  <input type="text" id="username" name="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
                </div>
              </div>

              <div className="form">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <Icon name="lock" />
                  <input type={showPassword ? "text" : "password"} id="password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
                </div>

                <label className="remember" htmlFor="showPassword">
                  <input type="checkbox" id="showPassword" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
                  Show password
                </label>

                <div className="row-between">
                  <label className="remember" htmlFor="rememberMe">
                    <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                    Remember me
                  </label>
                </div>

                {error ? <p className="login-error" role="alert">{error}</p> : null}

                <div className="actions">
                  <button type="submit" className="btn-primary btn-full">Login</button>
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
