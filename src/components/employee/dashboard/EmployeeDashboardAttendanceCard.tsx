"use client";

import Link from "next/link";

import { useEmployeeQrDemoAttendance } from "@/hooks/useEmployeeQrDemoAttendance";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { EmployeeDashboardTodayAttendance } from "@/data/employee-dashboard";

export function EmployeeDashboardAttendanceCard({
  employeeId,
  baselineAttendance,
}: {
  employeeId: string | null;
  baselineAttendance: EmployeeDashboardTodayAttendance | null;
}) {
  const { demoAttendance } = useEmployeeQrDemoAttendance(
    employeeId,
  );
  const hasDemoAttendance = demoAttendance !== null;
  const status =
    demoAttendance?.status ?? baselineAttendance?.status ?? "No record";
  const statusTone = demoAttendance
    ? "success"
    : baselineAttendance?.tone ?? "muted";
  const timeIn = demoAttendance?.timeIn ?? baselineAttendance?.timeIn ?? "—";
  const timeOut = demoAttendance?.timeOut ?? baselineAttendance?.timeOut ?? "—";
  const workHours = baselineAttendance?.workHours ?? "—";

  return (
    <section className="employee-panel attendance-card">
      <div className="employee-panel-heading">
        <div>
          <p className="employee-section-kicker">My attendance</p>
          <h2>Today&apos;s attendance</h2>
        </div>
        <StatusBadge tone={statusTone}>{status}</StatusBadge>
      </div>
      <div className="attendance-summary">
        <div>
          <span>Time in</span>
          <strong>{timeIn}</strong>
          <small>
            {hasDemoAttendance
              ? "Recorded via QR"
              : baselineAttendance?.sourceLabel ?? "No attendance record"}
          </small>
        </div>
        <div>
          <span>Time out</span>
          <strong>{timeOut}</strong>
          <small>
            {demoAttendance?.timeOut || baselineAttendance?.timeOut
              ? demoAttendance?.timeOut
                ? "Recorded via QR"
                : "Recorded via Bundy"
              : "No attendance record"}
          </small>
        </div>
        <div>
          <span>Work hours</span>
          <strong>{workHours}</strong>
          <small>
            {baselineAttendance?.workHours
              ? "Calculated from attendance records"
              : "No attendance record"}
          </small>
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
