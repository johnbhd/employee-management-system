"use client";

import Link from "next/link";

import { employeeAttendanceProfile } from "@/data/my-attendance";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getTodayAttendancePresentation,
} from "@/lib/employee/today-attendance";
import type { TodayAttendanceData } from "@/types/attendance-qr";

export function EmployeeDashboardAttendanceCard({
  attendanceLoadError,
  todayAttendance,
}: {
  attendanceLoadError: boolean;
  todayAttendance: TodayAttendanceData;
}) {
  const presentation = getTodayAttendancePresentation(
    todayAttendance.attendance,
    attendanceLoadError,
  );

  return (
    <section className="employee-panel attendance-card">
      <div className="employee-panel-heading">
        <div>
          <p className="employee-section-kicker">My attendance</p>
          <h2>Today&apos;s attendance</h2>
        </div>
        <StatusBadge tone={presentation.statusTone}>
          {presentation.status}
        </StatusBadge>
      </div>
      <div className="attendance-summary">
        <div className="attendance-summary-item attendance-summary-schedule">
          <Icon name="calendar" />
          <span>Today&apos;s schedule</span>
          <strong>{employeeAttendanceProfile.schedule}</strong>
          <small>{employeeAttendanceProfile.scheduleType}</small>
        </div>
        <div className="attendance-summary-item">
          <span>Time in</span>
          <strong>{presentation.timeIn}</strong>
          <small>{presentation.timeInNote}</small>
        </div>
        <div className="attendance-summary-item">
          <span>Time out</span>
          <strong>{presentation.timeOut}</strong>
          <small>{presentation.timeOutNote}</small>
        </div>
        <div className="attendance-summary-item">
          <span>Attendance source</span>
          <strong>{presentation.sourceValue}</strong>
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
