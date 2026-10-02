"use client";

import { useState } from "react";

import {
  employeeQrInfo,
  employeeQrSteps,
} from "@/data/attendance-qr";
import { Icon } from "@/components/ui/Icon";
import type { ApiErrorResponse } from "@/types/api/responses";
import type { EmployeeQrSuccessResponse } from "@/types/attendance-qr";
import type { EmployeeReference } from "@/types/employee";

import { AttendanceQrCard } from "./AttendanceQrCard";

type AttendanceQrPageProps = {
  employee: EmployeeReference | null;
  initialQrError: string | null;
  initialQrGeneratedAt: string | null;
  initialQrValue: string | null;
};

type EmployeeQrApiResponse = EmployeeQrSuccessResponse | ApiErrorResponse;

export function AttendanceQrPage({
  employee,
  initialQrError,
  initialQrGeneratedAt,
  initialQrValue,
}: AttendanceQrPageProps) {
  const [qrError, setQrError] = useState(initialQrError);
  const [qrGeneratedAt, setQrGeneratedAt] = useState(initialQrGeneratedAt);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrValue, setQrValue] = useState(initialQrValue);

  async function refreshQr() {
    setQrLoading(true);
    setQrError(null);

    try {
      const response = await fetch(
        "/api/v1/attendance/qr",
        {
          cache: "no-store",
        },
      );
      const body = await response.json() as EmployeeQrApiResponse;

      if (!response.ok || !body.success) {
        throw new Error(
          response.status === 403
            ? "Your employee QR is currently unavailable. Please contact the system administrator."
            : "Employee QR generation is temporarily unavailable.",
        );
      }

      setQrValue(body.data.qrValue);
      setQrGeneratedAt(body.data.generatedAt);
    } catch (error) {
      setQrError(
        error instanceof Error
          ? error.message
          : "Employee QR generation is temporarily unavailable.",
      );
    } finally {
      setQrLoading(false);
    }
  }

  return (
    <div className="attendance-qr-page">
      <p className="attendance-qr-page-subtitle">
        Present this employee-specific QR code at an authorized campus scanner.
      </p>

      <section className="attendance-qr-layout" aria-label="Attendance QR">
        <AttendanceQrCard
          employee={employee}
          onQrRefreshed={refreshQr}
          qrError={qrError}
          qrGeneratedAt={qrGeneratedAt}
          qrLoading={qrLoading}
          qrValue={qrValue}
        />

        <aside className="attendance-qr-side" aria-label="Attendance QR guidance">
          <div className="attendance-qr-info-card">
            <div className="attendance-qr-info-heading">
              <span className="attendance-qr-help-icon" aria-hidden="true">
                <Icon name={employeeQrInfo.icon} />
              </span>
              <h2>{employeeQrInfo.title}</h2>
            </div>
            <ol className="attendance-qr-step-list">
              {employeeQrSteps.map((step, index) => (
                <li key={step}>
                  <span className="attendance-qr-step-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="attendance-qr-notice-card">
            <div className="attendance-qr-notice-heading">
              <span className="attendance-qr-security-icon" aria-hidden="true">
                <Icon name={employeeQrInfo.securityIcon} />
              </span>
              <h2>{employeeQrInfo.securityTitle}</h2>
            </div>
            <p>{employeeQrInfo.securityMessage}</p>
          </div>
        </aside>
      </section>

      <p className="sr-only">
        QR attendance for {employee?.displayName ?? "Employee information unavailable"},
        employee ID {employee?.employeeId ?? "unavailable"}.
      </p>
    </div>
  );
}
