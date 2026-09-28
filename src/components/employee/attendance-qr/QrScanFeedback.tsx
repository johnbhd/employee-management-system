import { Icon } from "@/components/ui/Icon";

import type { QrScanFeedbackState } from "./attendance-qr-types";

type QrScanFeedbackProps = {
  feedback: QrScanFeedbackState;
};

export function QrScanFeedback({ feedback }: QrScanFeedbackProps) {
  const isCompleted = feedback.type === "completed";
  const title = feedback.type === "time-in"
    ? "Time-In Recorded"
    : feedback.type === "time-out"
      ? "Time-Out Recorded"
      : "Attendance Already Completed";
  const message = isCompleted
    ? "Your Time-In and Time-Out have already been recorded."
    : "Your attendance was recorded successfully.";

  return (
    <div
      className={`attendance-qr-scan-feedback ${isCompleted ? "is-neutral" : "is-success"}`}
      role="status"
      aria-live="polite"
    >
      <span className="attendance-qr-scan-feedback-icon" aria-hidden="true">
        <Icon name={isCompleted ? "info" : "check"} />
      </span>
      <strong>{title}</strong>
      <p>{message}</p>
      {feedback.type !== "completed" ? <time>{feedback.time}</time> : null}
    </div>
  );
}
