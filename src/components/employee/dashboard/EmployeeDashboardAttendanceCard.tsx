"use client";

import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getTodayAttendancePresentation,
} from "@/lib/employee/today-attendance";
import { getQrAttendanceDisplayStatus } from "@/lib/employee/qr-attendance-display";
import type { TodayAttendanceData } from "@/types/attendance-qr";

export function EmployeeDashboardAttendanceCard({
  attendanceLoadError,
  scheduledStart,
  todayAttendance,
}: {
  attendanceLoadError: boolean;
  scheduledStart: string | null;
  todayAttendance: TodayAttendanceData;
}) {
  const presentation = getTodayAttendancePresentation(
    todayAttendance.attendance,
    attendanceLoadError,
  );
  const demoStatus = getQrAttendanceDisplayStatus({
    timeIn: todayAttendance.attendance?.timeIn,
    timeInSource: todayAttendance.attendance?.timeInSource,
    scheduledStart,
  });
  const status = demoStatus ?? presentation.status;
  const statusTone = demoStatus === "Late"
    ? "warning"
    : demoStatus === "Present"
      ? "success"
      : presentation.statusTone;
  const sourceValue = presentation.sourceValue === "QR"
    ? "QR Attendance"
    : presentation.sourceValue;

  return (
    <section className="employee-panel attendance-card">
      <div className="employee-panel-heading">
        <div>
          <p className="employee-section-kicker">My attendance</p>
          <h2>Today&apos;s attendance</h2>
        </div>
        <StatusBadge tone={statusTone}>
          {status}
        </StatusBadge>
      </div>
      <div className="attendance-summary">
        <div>
          <span>Time in</span>
          <strong>{presentation.timeIn}</strong>
          <small>{presentation.timeInNote}</small>
        </div>
        <div>
          <span>Time out</span>
          <strong>{presentation.timeOut}</strong>
          <small>{presentation.timeOutNote}</small>
        </div>
        <div>
          <span>Attendance source</span>
          <strong>{sourceValue}</strong>
          <small>{presentation.sourceNote}</small>
        </div>
      </div>
      <div className="attendance-actions">
        <Link
          href="/employee/attendance-qr"
          className="employee-primary-button"
        >
          <Icon name="qr" />
          Show attendance QR
        </Link>
        <Link
          href="/employee/attendance-history"
          className="employee-secondary-button"
        >
          <Icon name="clock" />
          View history
        </Link>
      </div>
    </section>
  );
}
