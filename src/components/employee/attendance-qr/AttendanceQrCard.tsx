"use client";

import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { formatCampusDateTime, formatCampusTime } from "@/lib/campus-time";
import type { AttendanceDemoSettingsData } from "@/types/attendance-demo";
import type { QrAttendanceData } from "@/types/attendance-qr";
import type { EmployeeReference } from "@/types/employee";

import { QrScanFeedback } from "./QrScanFeedback";
import type { QrScanFeedbackState } from "./attendance-qr-types";

const NOT_AVAILABLE_LABEL = "Unavailable";

type AttendanceQrCardProps = {
  attendance: QrAttendanceData | null;
  attendanceError: string | null;
  attendanceFeedback: QrScanFeedbackState | null;
  attendanceRefreshing: boolean;
  demoSettings: AttendanceDemoSettingsData;
  employee: EmployeeReference | null;
  onAttendanceRetry: () => Promise<void>;
  onQrRefreshed: () => Promise<void>;
  qrError: string | null;
  qrGeneratedAt: string | null;
  qrLoading: boolean;
  qrValue: string | null;
};

export function AttendanceQrCard({
  attendance,
  attendanceError,
  attendanceFeedback,
  attendanceRefreshing,
  demoSettings,
  employee,
  onAttendanceRetry,
  onQrRefreshed,
  qrError,
  qrGeneratedAt,
  qrLoading,
  qrValue,
}: AttendanceQrCardProps) {
  const identityStatus = [
    {
      label: "QR Status",
      value: qrValue ? "Ready to scan" : "Unavailable",
      isPill: true,
      tone: qrValue ? "success" : "muted",
    },
    {
      label: "Employee ID",
      value: employee?.employeeId ?? NOT_AVAILABLE_LABEL,
      isPill: false,
      tone: "plain",
    },
    {
      label: "Department",
      value: employee?.department ?? NOT_AVAILABLE_LABEL,
      isPill: false,
      tone: "plain",
    },
    {
      label: "Attendance",
      value: getAttendanceStatusLabel(attendance),
      isPill: true,
      tone: attendance?.timeOut ? "success" : attendance ? "info" : "muted",
    },
  ] as const;

  return (
    <article className="attendance-qr-card" aria-labelledby="attendance-qr-employee">
      <div className="attendance-qr-employee">
        <div className="attendance-qr-avatar" aria-hidden="true">
          <Icon name="user" />
        </div>
        <div className="attendance-qr-employee-copy">
          <span className="attendance-qr-employee-kicker">Personal attendance QR</span>
          <h2 id="attendance-qr-employee">
            {employee?.displayName ?? "Employee information unavailable"}
          </h2>
          <p>
            Employee ID: <strong>{employee?.employeeId ?? NOT_AVAILABLE_LABEL}</strong>
          </p>
          <p>
            Department: <strong>{employee?.department ?? NOT_AVAILABLE_LABEL}</strong>
          </p>
        </div>
      </div>

      <div className="attendance-qr-divider" aria-hidden="true" />

      {demoSettings.featureEnabled && demoSettings.enabled ? (
        <div className="attendance-qr-demo-banner" role="status">
          <span className="attendance-qr-demo-badge">DEMO MODE</span>
          <span>
            Next attendance action will use {formatDemoTime(demoSettings.customTime)}.
          </span>
          <Link href="/employee/settings" className="attendance-qr-demo-link">
            Change in Settings
          </Link>
        </div>
      ) : null}

      <div className="attendance-qr-code-wrap" aria-busy={qrLoading}>
        <EmployeeQrImage
          employeeName={employee?.displayName ?? "Employee"}
          key={qrValue ?? "employee-qr-unavailable"}
          qrValue={qrValue}
        />
        {attendanceFeedback ? <QrScanFeedback feedback={attendanceFeedback} /> : null}
      </div>

      <div className="attendance-qr-meta">
        <span className="attendance-qr-identity-note">
          <Icon name="lock" />
          Signed employee identity QR
        </span>
        <span className="attendance-qr-datetime">
          {formatGeneratedAt(qrGeneratedAt)}
        </span>
      </div>

      <div className="attendance-qr-divider" aria-hidden="true" />

      <div className="attendance-qr-status-row" aria-label="Attendance QR status">
        {identityStatus.map((status) => (
          <div key={status.label}>
            <span className="attendance-qr-label">{status.label}</span>
            {status.isPill ? (
              <span className={`attendance-qr-pill attendance-qr-pill-${status.tone}`}>
                {status.value}
              </span>
            ) : (
              <span className="attendance-qr-value">{status.value}</span>
            )}
          </div>
        ))}
      </div>

      {qrError ? (
        <p className="attendance-qr-error" role="alert">
          <Icon name="warning" />
          {qrError}
        </p>
      ) : null}

      <AttendanceStatusPanel
        attendance={attendance}
        error={attendanceError}
        isRefreshing={attendanceRefreshing}
        onRetry={onAttendanceRetry}
      />

      <div className="attendance-qr-actions">
        <button
          type="button"
          className="attendance-qr-primary-button"
          disabled={qrLoading || !employee}
          onClick={() => void onQrRefreshed()}
        >
          <Icon name="refresh" />
          {qrLoading ? "Generating QR…" : "Refresh QR"}
        </button>
        <Link href="/employee/attendance-history" className="attendance-qr-secondary-button">
          <Icon name="clock" />
          View History
          <Icon name="chevron" />
        </Link>
      </div>
      <p className="attendance-qr-feedback" role="status" aria-live="polite">
        Attendance is recorded by an authorized scanner and reflected here automatically.
      </p>
    </article>
  );
}

function AttendanceStatusPanel({
  attendance,
  error,
  isRefreshing,
  onRetry,
}: {
  attendance: QrAttendanceData | null;
  error: string | null;
  isRefreshing: boolean;
  onRetry: () => Promise<void>;
}) {
  const isComplete = Boolean(attendance?.timeOut);
  const isTimedIn = Boolean(attendance?.timeIn);
  const title = error
    ? "Attendance status unavailable"
    : isComplete
      ? "Today's attendance is complete"
      : isTimedIn
        ? "Waiting for Time-Out"
        : "Waiting for attendance scan";
  const message = error
    ? error
    : isComplete
      ? "Your Time-In and Time-Out have been recorded."
      : isTimedIn
        ? `Time-In recorded at ${formatAttendanceTime(attendance?.timeIn)}. Show this QR again when you leave the campus.`
        : "Your QR is ready. Present it at an authorized scanner to record Time-In.";

  return (
    <section
      className={`attendance-qr-live-status${error ? " is-error" : isComplete ? " is-complete" : ""}`}
      aria-label="Live attendance status"
      aria-live="polite"
    >
      <div className="attendance-qr-live-status-icon" aria-hidden="true">
        <Icon name={error ? "warning" : isComplete ? "check" : isTimedIn ? "clock" : "qr"} />
      </div>
      <div className="attendance-qr-live-status-copy">
        <strong>{title}</strong>
        <p>{message}</p>
        {isComplete ? (
          <div className="attendance-qr-live-status-times">
            <span>Time-In: {formatAttendanceTime(attendance?.timeIn)}</span>
            <span>Time-Out: {formatAttendanceTime(attendance?.timeOut)}</span>
          </div>
        ) : null}
      </div>
      {error ? (
        <button
          type="button"
          className="attendance-qr-retry-button"
          disabled={isRefreshing}
          onClick={() => void onRetry()}
        >
          {isRefreshing ? "Retrying…" : "Retry"}
        </button>
      ) : null}
    </section>
  );
}

function getAttendanceStatusLabel(attendance: QrAttendanceData | null) {
  if (attendance?.timeOut) {
    return "Completed";
  }

  if (attendance?.timeIn) {
    return "Time-In recorded";
  }

  return "Waiting for scan";
}

function formatAttendanceTime(value: string | null | undefined) {
  if (!value) {
    return "Time unavailable";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : formatCampusTime(date);
}

function EmployeeQrImage({
  employeeName,
  qrValue,
}: {
  employeeName: string;
  qrValue: string | null;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState(false);

  useEffect(() => {
    let active = true;

    if (!qrValue) {
      return () => {
        active = false;
      };
    }

    void QRCode.toDataURL(
      qrValue,
      {
        color: {
          dark: "#101b3d",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
        margin: 2,
        width: 420,
      },
    )
      .then((nextDataUrl) => {
        if (active) {
          setDataUrl(nextDataUrl);
        }
      })
      .catch(() => {
        if (active) {
          setGenerationError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [qrValue]);

  if (!qrValue) {
    return (
      <p className="attendance-qr-code-state" role="status">
        Employee QR is unavailable.
      </p>
    );
  }

  if (generationError) {
    return (
      <p className="attendance-qr-code-state" role="alert">
        The QR image could not be generated. Please refresh the page.
      </p>
    );
  }

  if (!dataUrl) {
    return (
      <p className="attendance-qr-code-state" role="status" aria-live="polite">
        Preparing your employee QR…
      </p>
    );
  }

  return (
    <Image
      className="attendance-qr-code"
      src={dataUrl}
      alt={`Personal attendance QR code for ${employeeName}`}
      height={420}
      unoptimized
      width={420}
    />
  );
}

function formatGeneratedAt(value: string | null) {
  if (!value) {
    return "QR timestamp unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "QR timestamp unavailable";
  }

  return `Generated ${formatCampusDateTime(date)}`;
}

function formatDemoTime(value: string | null) {
  if (!value) {
    return "your saved time";
  }

  const [hours, minutes] = value.split(":");
  const hour = Number(hours);
  if (!Number.isInteger(hour) || !minutes) {
    return "your saved time";
  }

  return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
}
