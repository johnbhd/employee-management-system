"use client";

import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { formatCampusDateTime } from "@/lib/campus-time";
import type { EmployeeReference } from "@/types/employee";

const NOT_AVAILABLE_LABEL = "Unavailable";

type AttendanceQrCardProps = {
  employee: EmployeeReference | null;
  onQrRefreshed: () => Promise<void>;
  qrError: string | null;
  qrGeneratedAt: string | null;
  qrLoading: boolean;
  qrValue: string | null;
};

export function AttendanceQrCard({
  employee,
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
      value: "Not recorded here",
      isPill: false,
      tone: "plain",
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

      <div className="attendance-qr-code-wrap" aria-busy={qrLoading}>
        <EmployeeQrImage
          employeeName={employee?.displayName ?? "Employee"}
          key={qrValue ?? "employee-qr-unavailable"}
          qrValue={qrValue}
        />
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
        Attendance is not recorded from this page. Present the QR to an authorized scanner.
      </p>
    </article>
  );
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
