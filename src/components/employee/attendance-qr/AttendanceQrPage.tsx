"use client";

import { useState } from "react";

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
      </section>

      <p className="sr-only">
        QR attendance for {employee?.displayName ?? "Employee information unavailable"},
        employee ID {employee?.employeeId ?? "unavailable"}.
      </p>
    </div>
  );
}
