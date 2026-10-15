"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  changeFirebasePassword,
  FirebaseAuthClientError,
} from "@/lib/auth/client-session";
import type { SessionUser } from "@/types/auth";

type ChangePasswordFormProps = {
  user: SessionUser;
};

export function ChangePasswordForm({ user }: ChangePasswordFormProps) {
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
      setErrorMessage("Enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage("Your new password must be different from your current password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("The password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await changeFirebasePassword(
        user.username,
        currentPassword,
        newPassword,
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFeedback("Your password was changed successfully.");
      router.refresh();
    } catch (error) {
      if (
        error instanceof FirebaseAuthClientError
        && error.code === "INVALID_CREDENTIALS"
      ) {
        setErrorMessage("The current password is incorrect.");
      } else if (
        error instanceof FirebaseAuthClientError
        && error.code === "PASSWORD_POLICY"
      ) {
        setErrorMessage(error.message);
      } else if (
        error instanceof FirebaseAuthClientError
        && error.code === "ACCOUNT_UNAVAILABLE"
      ) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("The password could not be changed completely. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="employee-password-form-wrap">
      <form className="employee-password-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="employee-current-password">
          <span>Current password</span>
          <input
            id="employee-current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <label htmlFor="employee-new-password">
          <span>New password</span>
          <input
            id="employee-new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label htmlFor="employee-confirm-password">
          <span>Confirm new password</span>
          <input
            id="employee-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        {errorMessage ? (
          <p className="employee-password-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {feedback ? (
          <p className="employee-password-feedback" role="status" aria-live="polite">
            {feedback}
          </p>
        ) : null}

        <button
          type="submit"
          className="button-primary employee-password-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Changing password..." : "Change password"}
        </button>
      </form>

      <p className="employee-password-note">
        Only Firebase Authentication receives the password. It is not stored in
        PostgreSQL, import history, or audit records.
      </p>
    </div>
  );
}
