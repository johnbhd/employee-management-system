"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  consumeAuthFlashToast,
  type AuthToastMessage,
} from "@/lib/auth-flash-toast";

import { Icon } from "../ui/Icon";

const AUTH_TOAST_DURATION_MS = 2000;

export function AuthToastHost() {
  const pathname = usePathname();
  const [toast, setToast] = useState<AuthToastMessage | null>(null);
  const showTimeoutRef = useRef<number | null>(null);
  const dismissTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (showTimeoutRef.current !== null) {
      window.clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    const nextToast = consumeAuthFlashToast();

    if (!nextToast) {
      return;
    }

    if (dismissTimeoutRef.current !== null) {
      window.clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }

    showTimeoutRef.current = window.setTimeout(() => {
      setToast(nextToast);
      showTimeoutRef.current = null;
    }, 0);
    dismissTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      dismissTimeoutRef.current = null;
    }, AUTH_TOAST_DURATION_MS);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current !== null) {
        window.clearTimeout(showTimeoutRef.current);
      }

      if (dismissTimeoutRef.current !== null) {
        window.clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, []);

  if (!toast) {
    return null;
  }

  return (
    <div className="auth-toast-layer" aria-live="polite" aria-atomic="true">
      <div className={`auth-toast auth-toast-${toast.type}`} role="status">
        <span className="auth-toast-icon" aria-hidden="true">
          <Icon name="check" />
        </span>
        <span className="auth-toast-content">
          <strong className="auth-toast-title">{toast.title}</strong>
          <span className="auth-toast-description">{toast.description}</span>
        </span>
      </div>
    </div>
  );
}
