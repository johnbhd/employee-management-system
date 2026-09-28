"use client";

import {
  employeeAttendanceProfile,
  employeeAttendanceStats,
  type EmployeeAttendanceStat,
} from "@/data/my-attendance";
import { useEmployeeQrDemoAttendance } from "@/hooks/useEmployeeQrDemoAttendance";
import type { EmployeeQrDemoAttendance } from "@/lib/employee/qr-demo-attendance";

import { Icon } from "@/components/ui/Icon";

export function MyAttendanceToday() {
  const { demoAttendance } = useEmployeeQrDemoAttendance(
    employeeAttendanceProfile.employeeId,
  );
  const displayedStats = getDisplayedStats(demoAttendance);
  const status = demoAttendance?.status ?? employeeAttendanceProfile.status;
  const statusNote = demoAttendance
    ? demoAttendance.status === "Completed"
      ? "Time-In and Time-Out recorded via QR"
      : "Time-In recorded via QR"
    : employeeAttendanceProfile.statusNote;

  return (
    <>
      <section
        className="my-attendance-overview"
        aria-labelledby="my-attendance-profile"
      >
        <div className="my-attendance-employee">
          <div className="my-attendance-avatar" aria-hidden="true">
            <Icon name="user" />
          </div>
          <div className="my-attendance-employee-copy">
            <span className="my-attendance-kicker">Employee attendance</span>
            <h2 id="my-attendance-profile">
              {employeeAttendanceProfile.name}
            </h2>
            <p className="my-attendance-employee-meta">
              <span>{employeeAttendanceProfile.employeeId}</span>
              <span aria-hidden="true">·</span>
              <span>{employeeAttendanceProfile.department}</span>
            </p>
          </div>
        </div>

        <div className="my-attendance-overview-divider" aria-hidden="true" />

        <div className="my-attendance-schedule">
          <Icon name="calendar" />
          <div>
            <span className="my-attendance-label">Today&apos;s Schedule</span>
            <strong className="my-attendance-value">
              {employeeAttendanceProfile.schedule}
            </strong>
            <span className="my-attendance-subtext">
              {employeeAttendanceProfile.scheduleType}
            </span>
          </div>
        </div>

        <div className="my-attendance-status-box">
          <span className="my-attendance-label">Current Status</span>
          <strong className="my-attendance-status-value">
            <span className="my-attendance-status-dot" aria-hidden="true" />
            {status}
          </strong>
          <span className="my-attendance-subtext">{statusNote}</span>
        </div>
      </section>

      <section
        className="my-attendance-details-section"
        aria-labelledby="my-attendance-details-title"
      >
        <div className="my-attendance-section-heading">
          <div>
            <span className="my-attendance-kicker">Today</span>
            <h2 id="my-attendance-details-title">Attendance details</h2>
          </div>
          <span className="my-attendance-section-note">
            Authorized attendance record
          </span>
        </div>

        <div className="my-attendance-details-grid">
          {displayedStats.map((stat) => (
            <article className="my-attendance-detail" key={stat.label}>
              <span className="my-attendance-label">{stat.label}</span>
              <strong className="my-attendance-detail-value">
                {stat.value}
              </strong>
              <span className="my-attendance-subtext">{stat.note}</span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function getDisplayedStats(
  demoAttendance: EmployeeQrDemoAttendance | null,
): EmployeeAttendanceStat[] {
  if (!demoAttendance) {
    return employeeAttendanceStats;
  }

  return employeeAttendanceStats.map((stat) => {
    if (stat.label === "Time-In") {
      return {
        ...stat,
        value: demoAttendance.timeIn,
        note: "via QR",
      };
    }

    if (stat.label === "Time-Out") {
      return {
        ...stat,
        value: demoAttendance.timeOut ?? "—",
        note: demoAttendance.timeOut ? "via QR" : "Not yet timed out",
        tone: demoAttendance.timeOut ? "success" : "muted",
      };
    }

    if (stat.label === "Attendance Source") {
      return {
        ...stat,
        value: "QR",
        note: "Time-in recorded via QR",
        tone: "info",
      };
    }

    if (stat.label === "Late Minutes" || stat.label === "Undertime") {
      return {
        ...stat,
        value: "—",
        note: "Not available",
        tone: "muted",
      };
    }

    return stat;
  });
}
