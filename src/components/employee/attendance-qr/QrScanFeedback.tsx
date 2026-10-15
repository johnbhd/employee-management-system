import { Icon } from "@/components/ui/Icon";

import type { QrScanFeedbackState } from "./attendance-qr-types";

type QrScanFeedbackProps = {
  feedback: QrScanFeedbackState;
};

export function QrScanFeedback({ feedback }: QrScanFeedbackProps) {
  const isAlreadyRecorded = feedback.type === "already-recorded";
  const title = feedback.type === "time-in"
    ? "Time-In Recorded"
    : feedback.type === "time-out"
      ? "Time-Out Recorded"
      : "Attendance Already Recorded";
  const message = isAlreadyRecorded
    ? "Today's Time-In and Time-Out have already been recorded."
    : "Your attendance was recorded successfully.";

  return (
    <div
      className={`attendance-qr-scan-feedback ${isAlreadyRecorded ? "is-neutral" : "is-success"}`}
      role="status"
      aria-live="polite"
    >
      <span className="attendance-qr-scan-feedback-icon" aria-hidden="true">
        <Icon name={isAlreadyRecorded ? "info" : "check"} />
      </span>
      <strong>{title}</strong>
      <p>{message}</p>
      {feedback.type === "already-recorded" ? (
        <div className="attendance-qr-scan-feedback-times">
          <time>Time-In: {feedback.timeIn}</time>
          <time>Time-Out: {feedback.timeOut}</time>
        </div>
      ) : (
        <time>{feedback.time}</time>
      )}
    </div>
  );
}
