"use client";

import Link from "next/link";

import { useEmployeeQrDemoAttendance } from "@/hooks/useEmployeeQrDemoAttendance";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function EmployeeDashboardAttendanceCard({
  employeeId,
}: {
  employeeId: string | null;
}) {
  const { demoAttendance } = useEmployeeQrDemoAttendance(
    employeeId,
  );
  const hasDemoAttendance = demoAttendance !== null;

  return (
    <section className="employee-panel attendance-card">
      <div className="employee-panel-heading">
        <div>
          <p className="employee-section-kicker">My attendance</p>
          <h2>Today&apos;s attendance</h2>
        </div>
        <StatusBadge tone="success">
          {demoAttendance?.status ?? "On time"}
        </StatusBadge>
      </div>
      <div className="attendance-summary">
        <div>
          <span>Time in</span>
          <strong>{demoAttendance?.timeIn ?? "7:24 AM"}</strong>
          <small>
            {hasDemoAttendance ? "Recorded via QR" : "Recorded via Bundy"}
          </small>
        </div>
        <div>
          <span>Time out</span>
          <strong>{demoAttendance?.timeOut ?? "—"}</strong>
          <small>
            {demoAttendance?.timeOut
              ? "Recorded via QR"
              : "Not recorded yet"}
          </small>
        </div>
        <div>
          <span>Work hours</span>
          <strong>—</strong>
          <small>Calculated after time out</small>
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
