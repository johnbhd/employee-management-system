"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { employeeQrProfile } from "@/data/attendance-qr";
import { formatCampusDateTime } from "@/lib/campus-time";
import type { EmployeeReference } from "@/types/employee";

import { QrScanFeedback } from "./QrScanFeedback";
import type {
  DemoAttendanceState,
  QrScanFeedbackState,
} from "./attendance-qr-types";

const QR_SIZE = 29;
const QR_EXPIRY_SECONDS = 42;
const NOT_RECORDED_LABEL = "Not Recorded";

type Matrix = boolean[][];

type AttendanceQrCardProps = {
  employee: EmployeeReference | null;
  demoAttendanceState: DemoAttendanceState;
  qrGeneratedAt: Date | null;
  scanFeedback: QrScanFeedbackState | null;
  timeIn: string | null;
  timeOut: string | null;
  onQrRefreshed: () => void;
};

export function AttendanceQrCard({
  employee,
  demoAttendanceState,
  qrGeneratedAt,
  scanFeedback,
  timeIn,
  timeOut,
  onQrRefreshed,
}: AttendanceQrCardProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(QR_EXPIRY_SECONDS);
  const [qrVersion, setQrVersion] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds((seconds) => (seconds > 0 ? seconds - 1 : QR_EXPIRY_SECONDS));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const qrMatrix = useMemo(() => createPrototypeQrMatrix(qrVersion + 1), [qrVersion]);

  function refreshQr() {
    setQrVersion((version) => version + 1);
    setRemainingSeconds(QR_EXPIRY_SECONDS);
    setFeedback("A new prototype QR code was generated.");
    onQrRefreshed();
  }

  const attendanceStatus = [
    {
      label: "Current Status",
      value: getDemoAttendanceStatusLabel(demoAttendanceState),
      isPill: true,
      tone: demoAttendanceState === "not-timed-in" ? "muted" : "success",
    },
    {
      label: "Schedule",
      value: employeeQrProfile.schedule,
      isPill: false,
      tone: "plain",
    },
    {
      label: "Time-In",
      value: timeIn ?? NOT_RECORDED_LABEL,
      isPill: timeIn === null,
      tone: timeIn === null ? "muted" : "success",
    },
    {
      label: "Time-Out",
      value: timeOut ?? NOT_RECORDED_LABEL,
      isPill: timeOut === null,
      tone: timeOut === null ? "muted" : "success",
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
            Employee ID: <strong>{employee?.employeeId ?? "Unavailable"}</strong>
          </p>
          <p>
            Department: <strong>{employee?.department ?? "Unavailable"}</strong>
          </p>
        </div>
      </div>

      <div className="attendance-qr-divider" aria-hidden="true" />

      <div className="attendance-qr-code-wrap">
        <PrototypeQrCode version={qrVersion} matrix={qrMatrix} />
        {scanFeedback ? <QrScanFeedback feedback={scanFeedback} /> : null}
      </div>

      <div className="attendance-qr-meta">
        <span className="attendance-qr-timer">
          <Icon name="clock" />
          QR expires in{" "}
          <strong
            className="attendance-qr-expire-badge"
            aria-live="polite"
            aria-label={`QR expires in ${formatCountdown(remainingSeconds)}`}
          >
            {formatCountdown(remainingSeconds)}
          </strong>
        </span>
        <span className="attendance-qr-datetime">
          {qrGeneratedAt ? formatCampusDateTime(qrGeneratedAt) : "Generating QR timestamp…"}
        </span>
      </div>

      <div className="attendance-qr-divider" aria-hidden="true" />

      <div className="attendance-qr-status-row" aria-label="Attendance status">
        {attendanceStatus.map((status) => (
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

      <div className="attendance-qr-actions">
        <button type="button" className="attendance-qr-primary-button" onClick={refreshQr}>
          <Icon name="refresh" />
          Refresh QR
        </button>
        <Link href="/employee/attendance-history" className="attendance-qr-secondary-button">
          <Icon name="clock" />
          View History
          <Icon name="chevron" />
        </Link>
      </div>
      <p className="attendance-qr-feedback" role="status" aria-live="polite">
        {feedback}
      </p>
    </article>
  );
}

function getDemoAttendanceStatusLabel(state: DemoAttendanceState) {
  if (state === "timed-in") {
    return "Present";
  }

  if (state === "completed") {
    return "Completed";
  }

  return "Not Yet Timed In";
}

function PrototypeQrCode({ matrix, version }: { matrix: Matrix; version: number }) {
  return (
    <svg
      className="attendance-qr-code"
      viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`}
      role="img"
      aria-label={`Temporary attendance QR code, version ${version + 1}`}
      shapeRendering="crispEdges"
    >
      <rect width={QR_SIZE} height={QR_SIZE} fill="#fff" />
      {matrix.flatMap((row, y) =>
        row.map((isDark, x) =>
          isDark ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#12182b" /> : null,
        ),
      )}
    </svg>
  );
}

function formatCountdown(seconds: number) {
  return `00:${String(seconds).padStart(2, "0")}`;
}

function createPrototypeQrMatrix(seed: number): Matrix {
  const matrix = Array.from({ length: QR_SIZE }, () => Array(QR_SIZE).fill(false));
  const reserved = Array.from({ length: QR_SIZE }, () => Array(QR_SIZE).fill(false));

  addFinderPattern(matrix, reserved, 0, 0);
  addFinderPattern(matrix, reserved, QR_SIZE - 7, 0);
  addFinderPattern(matrix, reserved, 0, QR_SIZE - 7);

  for (let index = 8; index < QR_SIZE - 8; index += 1) {
    if (!reserved[6][index]) {
      reserved[6][index] = true;
      matrix[6][index] = index % 2 === 0;
    }
    if (!reserved[index][6]) {
      reserved[index][6] = true;
      matrix[index][6] = index % 2 === 0;
    }
  }

  let value = Math.imul(seed + 1, 0x45d9f3b);
  for (let y = 0; y < QR_SIZE; y += 1) {
    for (let x = 0; x < QR_SIZE; x += 1) {
      if (reserved[y][x]) {
        continue;
      }

      value = Math.imul(value ^ (x + y * QR_SIZE + 1), 0x27d4eb2d);
      value ^= value >>> 15;
      matrix[y][x] = (value & 1) === 1;
    }
  }

  return matrix;
}

function addFinderPattern(matrix: Matrix, reserved: boolean[][], startX: number, startY: number) {
  for (let y = -1; y <= 7; y += 1) {
    for (let x = -1; x <= 7; x += 1) {
      const cellX = startX + x;
      const cellY = startY + y;

      if (cellX < 0 || cellY < 0 || cellX >= QR_SIZE || cellY >= QR_SIZE) {
        continue;
      }

      reserved[cellY][cellX] = true;
      matrix[cellY][cellX] =
        x >= 0 && x <= 6 && y >= 0 && y <= 6 &&
        (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
    }
  }
}
