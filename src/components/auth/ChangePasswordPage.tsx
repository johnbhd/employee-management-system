"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import {
  changeFirebasePassword,
  FirebaseAuthClientError,
  logoutFromFirebaseSession,
} from "@/lib/auth/client-session";
import type { SessionUser } from "@/types/auth";

type ChangePasswordPageProps = {
  user: SessionUser;
};

export function ChangePasswordPage({ user }: ChangePasswordPageProps) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setFeedback("");

    if (!currentPassword) {
      setErrorMessage("Enter your current temporary password.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("Your new password must contain at least 8 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage("Your new password must be different from the temporary password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("The password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await changeFirebasePassword(user.username, currentPassword, newPassword);
      setFeedback("Password changed. Redirecting to your Employee dashboard…");
      router.replace(session.redirectTo);
      router.refresh();
    } catch (error) {
      if (error instanceof FirebaseAuthClientError && error.code === "INVALID_CREDENTIALS") {
        setErrorMessage("The current password is incorrect.");
      } else if (error instanceof FirebaseAuthClientError && error.code === "ACCOUNT_UNAVAILABLE") {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("The password could not be changed completely. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    await logoutFromFirebaseSession();
    router.replace("/");
  }

  return (
    <main className="account-change-page">
      <section className="account-change-card" aria-labelledby="account-change-title">
        <div className="account-change-icon" aria-hidden="true"><Icon name="lock" /></div>
        <span className="section-eyebrow">Account setup</span>
        <h1 id="account-change-title">Create your new password</h1>
        <p className="account-change-intro">
          Welcome, {user.displayName}. Your Employee account is ready, but you must replace the temporary password before using the portal.
        </p>
        <form className="account-change-form" onSubmit={handleSubmit} noValidate>
          <label>
            <span>Current temporary password</span>
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          <label>
            <span>New password</span>
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
          </label>
          <label>
            <span>Confirm new password</span>
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
          </label>
          {errorMessage ? <p className="account-change-error" role="alert">{errorMessage}</p> : null}
          {feedback ? <p className="account-change-feedback" role="status" aria-live="polite">{feedback}</p> : null}
          <button type="submit" className="button-primary account-change-submit" disabled={isSubmitting}>
            {isSubmitting ? "Changing password…" : "Change password"}
          </button>
        </form>
        <button type="button" className="button-secondary account-change-logout" onClick={() => void handleLogout()} disabled={isSubmitting}>Log out</button>
        <p className="account-change-note">Only Firebase Authentication receives the password. It is not stored in PostgreSQL, import history, or audit records.</p>
      </section>
    </main>
  );
}
