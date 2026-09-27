"use client";

import Link from "next/link";
import { useState } from "react";

import { Icon } from "@/components/ui/Icon";

const quickActions = [
  {
    icon: "qr" as const,
    title: "Show QR",
    description: "Show your attendance QR code",
    href: "/employee/attendance-qr",
  },
  {
    icon: "clock" as const,
    title: "View History",
    description: "Review your past attendance records",
    href: "/employee/attendance-history",
    message: "You are viewing the current attendance page.",
  },
  {
    icon: "file" as const,
    title: "Request Correction",
    description: "Report or request an attendance correction",
    message: "Correction requests are not connected in this prototype.",
  },
];

export function MyAttendanceQuickActions() {
  const [feedback, setFeedback] = useState("");

  return (
    <>
      <div className="my-attendance-action-list">
        {quickActions.map((action) => (
          action.href ? (
            <Link
              className={`my-attendance-action ${action.title === "Show QR" ? "is-primary" : ""}`}
              href={action.href}
              key={action.title}
            >
              <Icon name={action.icon} />
              <span>
                <strong>{action.title}</strong>
                <small>{action.description}</small>
              </span>
            </Link>
          ) : (
            <button
              type="button"
              className="my-attendance-action"
              key={action.title}
              onClick={() => setFeedback(action.message ?? "")}
            >
              <Icon name={action.icon} />
              <span>
                <strong>{action.title}</strong>
                <small>{action.description}</small>
              </span>
            </button>
          )
        ))}
      </div>
      <p
        className="my-attendance-action-feedback"
        role="status"
        aria-live="polite"
      >
        {feedback}
      </p>
    </>
  );
}
