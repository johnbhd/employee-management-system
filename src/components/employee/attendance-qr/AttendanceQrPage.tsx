"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatCampusTime } from "@/lib/campus-time";
import type { ApiErrorResponse } from "@/types/api/responses";
import type {
  EmployeeQrSuccessResponse,
  QrAttendanceData,
  TodayAttendanceData,
  TodayAttendanceSuccessResponse,
} from "@/types/attendance-qr";
import type { EmployeeReference } from "@/types/employee";

import { AttendanceQrCard } from "./AttendanceQrCard";
import type { QrScanFeedbackState } from "./attendance-qr-types";

const ATTENDANCE_POLL_INTERVAL_MS = 2500;

type AttendanceQrPageProps = {
  employee: EmployeeReference | null;
  initialAttendance: TodayAttendanceData;
  initialAttendanceError: string | null;
  initialQrError: string | null;
  initialQrGeneratedAt: string | null;
  initialQrValue: string | null;
};

type EmployeeQrApiResponse = EmployeeQrSuccessResponse | ApiErrorResponse;
type AttendanceApiResponse = TodayAttendanceSuccessResponse | ApiErrorResponse;

export function AttendanceQrPage({
  employee,
  initialAttendance,
  initialAttendanceError,
  initialQrError,
  initialQrGeneratedAt,
  initialQrValue,
}: AttendanceQrPageProps) {
  const [attendance, setAttendance] = useState(initialAttendance.attendance);
  const [attendanceError, setAttendanceError] = useState(initialAttendanceError);
  const [attendanceRefreshing, setAttendanceRefreshing] = useState(false);
  const [attendanceFeedback, setAttendanceFeedback] =
    useState<QrScanFeedbackState | null>(() => getInitialFeedback(initialAttendance.attendance));
  const [qrError, setQrError] = useState(initialQrError);
  const [qrGeneratedAt, setQrGeneratedAt] = useState(initialQrGeneratedAt);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrValue, setQrValue] = useState(initialQrValue);
  const attendanceRef = useRef(initialAttendance.attendance);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const pollInFlightRef = useRef(false);

  const showFeedback = useCallback((feedback: QrScanFeedbackState) => {
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    setAttendanceFeedback(feedback);

    if (feedback.type === "already-recorded") {
      return;
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setAttendanceFeedback(null);
      feedbackTimeoutRef.current = null;
    }, 3200);
  }, []);

  const pollAttendance = useCallback(async (force = false) => {
    if (
      !employee
      || pollInFlightRef.current
      || (!force && attendanceRef.current?.timeOut)
    ) {
      return;
    }

    pollInFlightRef.current = true;

    if (isMountedRef.current) {
      setAttendanceRefreshing(true);
    }

    try {
      const response = await fetch("/api/v1/attendance/me/today", {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });
      const body = await response.json() as AttendanceApiResponse;

      if (!response.ok || !body.success) {
        throw new Error(getAttendanceErrorMessage(response.status, body));
      }

      const nextAttendance = body.data.attendance;
      const previousAttendance = attendanceRef.current;

      if (
        !previousAttendance?.timeIn
        && nextAttendance?.timeIn
        && !nextAttendance.timeOut
      ) {
        showFeedback({
          type: "time-in",
          time: formatAttendanceTime(nextAttendance.timeIn),
        });
      } else if (!previousAttendance?.timeOut && nextAttendance?.timeOut) {
        showFeedback({
          type: "time-out",
          time: formatAttendanceTime(nextAttendance.timeOut),
        });
      }

      attendanceRef.current = nextAttendance;

      if (isMountedRef.current) {
        setAttendance(nextAttendance);
        setAttendanceError(null);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setAttendanceError(
          error instanceof Error
            ? error.message
            : "Today's attendance could not be refreshed. Please try again.",
        );
      }
    } finally {
      pollInFlightRef.current = false;

      if (isMountedRef.current) {
        setAttendanceRefreshing(false);
      }
    }
  }, [employee, showFeedback]);

  useEffect(() => {
    isMountedRef.current = true;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void pollAttendance();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void pollAttendance();
      }
    }, ATTENDANCE_POLL_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);

      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [pollAttendance]);

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

  async function retryAttendance() {
    await pollAttendance(true);
  }

  return (
    <div className="attendance-qr-page">
      <p className="attendance-qr-page-subtitle">
        Present this employee-specific QR code at an authorized campus scanner.
      </p>

      <section className="attendance-qr-layout" aria-label="Attendance QR">
        <AttendanceQrCard
          attendance={attendance}
          attendanceError={attendanceError}
          attendanceFeedback={attendanceFeedback}
          attendanceRefreshing={attendanceRefreshing}
          employee={employee}
          onAttendanceRetry={retryAttendance}
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

function getInitialFeedback(
  attendance: QrAttendanceData | null,
): QrScanFeedbackState | null {
  if (!attendance?.timeIn || !attendance.timeOut) {
    return null;
  }

  return {
    type: "already-recorded",
    timeIn: formatAttendanceTime(attendance.timeIn),
    timeOut: formatAttendanceTime(attendance.timeOut),
  };
}

function formatAttendanceTime(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : formatCampusTime(date);
}

function getAttendanceErrorMessage(
  status: number,
  body: AttendanceApiResponse,
) {
  if (status === 401) {
    return "Your employee session has expired. Sign in again to refresh attendance status.";
  }

  if (status === 403) {
    return "Your employee attendance status is unavailable for this account.";
  }

  if (!body.success && body.error.message) {
    return body.error.message;
  }

  return "Today's attendance could not be refreshed. Please try again.";
}
