"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  employeeQrInfo,
  employeeQrProfile,
  employeeQrSteps,
} from "@/data/attendance-qr";
import { Icon } from "@/components/ui/Icon";
import { useEmployeeQrDemoAttendance } from "@/hooks/useEmployeeQrDemoAttendance";

import { AttendanceQrCard } from "./AttendanceQrCard";
import type {
  DemoAttendanceState,
  QrScanFeedbackState,
} from "./attendance-qr-types";

const SCAN_FEEDBACK_DURATION_MS = 2600;

export function AttendanceQrPage() {
  const [qrGeneratedAt, setQrGeneratedAt] = useState<Date | null>(null);
  const [scanFeedback, setScanFeedback] = useState<QrScanFeedbackState | null>(null);
  const scanFeedbackTimeoutRef = useRef<number | null>(null);
  const {
    demoAttendance,
    recordQrScan,
    resetDemoAttendance,
  } = useEmployeeQrDemoAttendance(employeeQrProfile.employeeId);

  const demoAttendanceState = getDemoAttendanceState(demoAttendance?.status);

  useEffect(() => {
    const qrInitializationTimer = window.setTimeout(() => {
      setQrGeneratedAt(new Date());
    }, 0);

    return () => {
      window.clearTimeout(qrInitializationTimer);

      if (scanFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(scanFeedbackTimeoutRef.current);
      }
    };
  }, []);

  function showScanFeedback(nextFeedback: QrScanFeedbackState) {
    if (scanFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(scanFeedbackTimeoutRef.current);
    }

    setScanFeedback(nextFeedback);
    scanFeedbackTimeoutRef.current = window.setTimeout(() => {
      setScanFeedback(null);
      scanFeedbackTimeoutRef.current = null;
    }, SCAN_FEEDBACK_DURATION_MS);
  }

  // Temporary presentation behavior: the help question-mark icon simulates
  // an authorized QR scan until a real attendance scanner is connected.
  function handleDemoQrScan() {
    const scanResult = recordQrScan(new Date());

    if (scanResult.action === "time-in" || scanResult.action === "time-out") {
      const scanTime = scanResult.action === "time-in"
        ? scanResult.attendance.timeIn
        : scanResult.attendance.timeOut;

      showScanFeedback({
        type: scanResult.action,
        time: scanTime ?? "",
      });
      return;
    }

    if (scanResult.action === "completed") {
      showScanFeedback({ type: "completed" });
    }
  }

  function handleQrRefreshed() {
    setQrGeneratedAt(new Date());
  }

  return (
    <div className="attendance-qr-page">
      <nav className="attendance-qr-breadcrumb" aria-label="Breadcrumb">
        <Link href="/employee/dashboard">Dashboard</Link>
        <Icon name="chevron" />
        <span aria-current="page">Show Attendance QR</span>
      </nav>

      <p className="attendance-qr-page-subtitle">
        Present this QR code at an authorized campus attendance station.
      </p>

      <section className="attendance-qr-layout" aria-label="Attendance QR">
        <AttendanceQrCard
          demoAttendanceState={demoAttendanceState}
          onQrRefreshed={handleQrRefreshed}
          qrGeneratedAt={qrGeneratedAt}
          scanFeedback={scanFeedback}
          timeIn={demoAttendance?.timeIn ?? null}
          timeOut={demoAttendance?.timeOut ?? null}
        />

        <aside className="attendance-qr-side" aria-label="Attendance QR guidance">
          <div className="attendance-qr-info-card">
            <div className="attendance-qr-info-heading">
              <button
                type="button"
                className="attendance-qr-help-trigger"
                onClick={handleDemoQrScan}
                aria-label="Attendance recording information"
              >
                <Icon name={employeeQrInfo.icon} />
              </button>
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
              <button
                type="button"
                className="attendance-qr-security-trigger"
                onClick={resetDemoAttendance}
                aria-label="Reset temporary attendance demo"
              >
                <Icon name={employeeQrInfo.securityIcon} />
              </button>
              <h2>{employeeQrInfo.securityTitle}</h2>
            </div>
            <p>{employeeQrInfo.securityMessage}</p>
          </div>
        </aside>
      </section>

      <p className="sr-only">
        QR attendance for {employeeQrProfile.name}, employee ID {employeeQrProfile.employeeId}.
      </p>
    </div>
  );
}

function getDemoAttendanceState(
  status: "Present" | "Completed" | undefined,
): DemoAttendanceState {
  if (status === "Completed") {
    return "completed";
  }

  if (status === "Present") {
    return "timed-in";
  }

  return "not-timed-in";
}
