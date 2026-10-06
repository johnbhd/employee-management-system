"use client";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCampusDateTime, formatCampusTime } from "@/lib/campus-time";
import type {
  QrAttendanceAction,
  QrResolveData,
} from "@/types/attendance-qr";

type ScannedEmployeeCardProps = {
  result: QrResolveData;
  onScanNext: () => void;
};

export function ScannedEmployeeCard({
  onScanNext,
  result,
}: ScannedEmployeeCardProps) {
  const statusTone = result.employee.employmentStatus === "active"
    ? "success"
    : "warning";
  const scannedAt = new Date(result.scannedAt);
  const timeIn = new Date(result.attendance.timeIn);
  const timeOut = result.attendance.timeOut
    ? new Date(result.attendance.timeOut)
    : null;
  const isDuplicate = result.action === "duplicate_scan";
  const resultTone = getResultTone(result.action);
  const resultTitle = getResultTitle(result.action);
  const resultKicker = result.action === "already_completed"
    ? "Attendance status"
    : isDuplicate
      ? "Duplicate scan prevented"
      : "Attendance recorded";

  return (
    <section
      className={`attendance-scanner-result attendance-scanner-result-${resultTone}`}
      aria-labelledby="scanner-result-heading"
    >
      <div className="attendance-scanner-result-heading">
        <span className="attendance-scanner-feedback-icon" aria-hidden="true">
          <Icon name={getResultIcon(result.action)} />
        </span>
        <div>
          <span className="attendance-scanner-kicker">{resultKicker}</span>
          <h2 id="scanner-result-heading" aria-live="polite">{resultTitle}</h2>
        </div>
      </div>

      <div className="attendance-scanner-employee">
        <div className="attendance-scanner-avatar" aria-hidden="true">
          <Icon name="user" />
        </div>
        <div>
          <h3>{result.employee.displayName}</h3>
          <p>{result.employee.employeeId}</p>
        </div>
      </div>

      <dl className="attendance-scanner-detail-grid">
        <div>
          <dt>Department</dt>
          <dd>{result.employee.department}</dd>
        </div>
        <div>
          <dt>Position</dt>
          <dd>{result.employee.position ?? "Not provided"}</dd>
        </div>
        <div>
          <dt>Employee status</dt>
          <dd>
            <StatusBadge tone={statusTone}>
              {result.employee.employmentStatus === "active" ? "Active" : "Inactive"}
            </StatusBadge>
          </dd>
        </div>
        <div>
          <dt>Attendance date</dt>
          <dd>{result.attendance.date}</dd>
        </div>
        <div>
          <dt>Time In</dt>
          <dd>{formatAttendanceTime(timeIn)}</dd>
        </div>
        <div>
          <dt>Time Out</dt>
          <dd>{timeOut ? formatAttendanceTime(timeOut) : "Not recorded"}</dd>
        </div>
        <div>
          <dt>Attendance status</dt>
          <dd>
            <StatusBadge tone={result.attendance.status === "completed" ? "success" : "info"}>
              {result.attendance.status === "completed" ? "Completed" : "Present"}
            </StatusBadge>
          </dd>
        </div>
        <div>
          <dt>Scanned at</dt>
          <dd>
            {Number.isNaN(scannedAt.getTime())
              ? "Time unavailable"
              : formatCampusDateTime(scannedAt)}
          </dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{result.source}</dd>
        </div>
      </dl>

      <p className={`attendance-scanner-result-note${isDuplicate ? " attendance-scanner-result-note-warning" : ""}`} role="status">
        {getResultNote(result.action)}
      </p>

      <button
        type="button"
        className="attendance-scanner-primary-button"
        onClick={onScanNext}
      >
        <Icon name="refresh" />
        Scan Next Employee
      </button>
    </section>
  );
}

function getResultTitle(action: QrAttendanceAction) {
  if (action === "time_in") {
    return "Time In Recorded";
  }

  if (action === "time_out") {
    return "Time Out Recorded";
  }

  if (action === "duplicate_scan") {
    return "Scan Already Processed";
  }

  return "Attendance Already Completed";
}

function getResultTone(action: QrAttendanceAction) {
  if (action === "time_in" || action === "time_out") {
    return "success";
  }

  if (action === "duplicate_scan") {
    return "warning";
  }

  return "neutral";
}

function getResultIcon(action: QrAttendanceAction) {
  if (action === "duplicate_scan") {
    return "warning" as const;
  }

  if (action === "already_completed") {
    return "info" as const;
  }

  return "check" as const;
}

function getResultNote(action: QrAttendanceAction) {
  if (action === "time_in") {
    return "Time In was recorded in the employee's attendance record for today.";
  }

  if (action === "time_out") {
    return "Time Out was recorded. The original Time In remains unchanged.";
  }

  if (action === "duplicate_scan") {
    return "No new attendance action was created because this scan arrived too soon after the previous successful scan. Scan again after a few seconds if a Time Out is intended.";
  }

  return "This employee's attendance is already complete for today. No attendance values were changed.";
}

function formatAttendanceTime(value: Date) {
  return Number.isNaN(value.getTime()) ? "Time unavailable" : formatCampusTime(value);
}
