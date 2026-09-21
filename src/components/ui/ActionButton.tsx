"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Icon } from "./Icon";
import type { IconName } from "@/types/ui";

type ActionButtonProps = {
  children: ReactNode;
  action?: string;
  variant?: "primary" | "secondary" | "link";
  icon?: IconName;
  className?: string;
  onAction?: () => void;
};

export function ActionButton({
  children,
  action = "Action completed.",
  variant = "secondary",
  icon,
  className = "",
  onAction,
}: ActionButtonProps) {
  const [message, setMessage] = useState("");

  function handleClick() {
    onAction?.();
    setMessage(action);
    window.setTimeout(() => setMessage(""), 2200);
  }

  return (
    <span className={`action-control ${className}`.trim()}>
      <button type="button" className={`button-${variant}`} onClick={handleClick}>
        {icon ? <Icon name={icon} /> : null}
        {children}
      </button>
      <span className="sr-only" aria-live="polite">
        {message}
      </span>
    </span>
  );
}
