"use client";

import { Icon } from "@/components/ui/Icon";
import {
  getTodayAttendancePresentation,
} from "@/lib/employee/today-attendance";
import {
  employeeAttendanceProfile,
  employeeAttendanceStats,
  type EmployeeAttendanceStat,
} from "@/data/my-attendance";
import type { QrAttendanceData, TodayAttendanceData } from "@/types/attendance-qr";
import type { EmployeeReference } from "@/types/employee";

export function MyAttendanceToday({
  attendanceLoadError,
  employee,
  todayAttendance,
  todayLabel,
}: {
  attendanceLoadError: boolean;
  employee: EmployeeReference | null;
  todayAttendance: TodayAttendanceData;
  todayLabel: string;
}) {
  const isUnavailable = attendanceLoadError || employee === null;
  const presentation = getTodayAttendancePresentation(
    todayAttendance.attendance,
    isUnavailable,
  );
  const displayedStats = getDisplayedStats(
    todayAttendance.attendance,
    isUnavailable,
  );
  const employeeName = employee?.displayName ?? "Employee information unavailable";
  const employeeId = employee?.employeeId ?? "Employee ID unavailable";
  const department = employee?.department ?? "Employee details unavailable";
  const statusClass = isUnavailable
    ? "is-error"
    : todayAttendance.attendance
      ? "is-present"
      : "is-empty";

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
              {employeeName}
            </h2>
            <p className="my-attendance-employee-meta">
              <span>{employeeId}</span>
              <span aria-hidden="true">·</span>
              <span>{department}</span>
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

        <div className={`my-attendance-status-box ${statusClass}`}>
          <span className="my-attendance-label">Current Status</span>
          <strong className="my-attendance-status-value">
            <span className="my-attendance-status-dot" aria-hidden="true" />
            {presentation.status}
          </strong>
          <span className="my-attendance-subtext">
            {presentation.statusNote}
          </span>
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
            {todayLabel}
          </span>
        </div>

        {attendanceLoadError ? (
          <p className="my-attendance-data-error" role="alert">
            Unable to load today&apos;s attendance. Please try again.
          </p>
        ) : null}

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
  attendance: QrAttendanceData | null,
  isUnavailable: boolean,
): EmployeeAttendanceStat[] {
  const presentation = getTodayAttendancePresentation(
    attendance,
    isUnavailable,
  );

  return employeeAttendanceStats.map((stat) => {
    if (stat.label === "Time-In") {
      return {
        ...stat,
        value: presentation.timeIn,
        note: presentation.timeInNote,
      };
    }

    if (stat.label === "Time-Out") {
      return {
        ...stat,
        value: presentation.timeOut,
        note: presentation.timeOutNote,
        tone: attendance?.timeOut ? "success" : "muted",
      };
    }

    if (stat.label === "Attendance Source") {
      return {
        ...stat,
        value: presentation.sourceValue,
        note: presentation.sourceNote,
        tone: presentation.sourceValue === "\u2014" ? "muted" : "info",
      };
    }

    if (stat.label === "Late Minutes" || stat.label === "Undertime") {
      return {
        ...stat,
        value: "\u2014",
        note: "Not available",
        tone: "muted",
      };
    }

    return stat;
  });
}
