"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/Icon";

const quickActions = [
  {
    icon: "qr" as const,
    title: "Open QR",
    description: "Show your attendance QR code",
    message: "The attendance QR page is not connected in this prototype.",
  },
  {
    icon: "clock" as const,
    title: "View Attendance History",
    description: "Review your past attendance records",
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
      <div className="my-attendance-quick-grid">
        {quickActions.map((action) => (
          <button
            type="button"
            className="my-attendance-quick-card"
            key={action.title}
            onClick={() => setFeedback(action.message)}
          >
            <Icon name={action.icon} />
            <span>
              <strong>{action.title}</strong>
              <small>{action.description}</small>
            </span>
          </button>
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
