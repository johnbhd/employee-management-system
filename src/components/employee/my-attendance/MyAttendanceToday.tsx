"use client";

import { Icon } from "@/components/ui/Icon";
import { formatCampusTime } from "@/lib/campus-time";
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
  const hasAttendance = todayAttendance.attendance !== null;
  const isUnavailable = attendanceLoadError || employee === null;
  const displayedStats = getDisplayedStats(
    todayAttendance.attendance,
    isUnavailable,
  );
  const status = isUnavailable
    ? "Unavailable"
    : hasAttendance
      ? todayAttendance.attendance?.status === "completed"
        ? "Completed"
        : "Present"
      : "Not Yet Timed-In";
  const statusNote = isUnavailable
    ? "Unable to load today's attendance. Please try again."
    : hasAttendance
      ? todayAttendance.attendance?.status === "completed"
        ? "Time-In and Time-Out recorded"
        : "Time-In recorded; Time-Out is still pending"
      : "No attendance recorded for today";
  const employeeName = employee?.displayName ?? "Employee information unavailable";
  const employeeId = employee?.employeeId ?? "Employee ID unavailable";
  const department = employee?.department ?? "Employee details unavailable";
  const statusClass = isUnavailable
    ? "is-error"
    : hasAttendance
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
  const timeIn = attendance
    ? formatAttendanceTime(attendance.timeIn)
    : "—";
  const timeOut = attendance?.timeOut
    ? formatAttendanceTime(attendance.timeOut)
    : "—";
  const source = getAttendanceSource(attendance, isUnavailable);

  return employeeAttendanceStats.map((stat) => {
    if (stat.label === "Time-In") {
      return {
        ...stat,
        value: timeIn,
        note: isUnavailable
          ? "Unavailable"
          : attendance
            ? `via ${attendance.timeInSource}`
            : "Not yet timed-in",
      };
    }

    if (stat.label === "Time-Out") {
      return {
        ...stat,
        value: timeOut,
        note: isUnavailable
          ? "Unavailable"
          : attendance?.timeOut
            ? `via ${attendance.timeOutSource ?? "attendance source"}`
            : attendance
              ? "Not yet timed out"
              : "Not yet timed-in",
        tone: attendance?.timeOut ? "success" : "muted",
      };
    }

    if (stat.label === "Attendance Source") {
      return {
        ...stat,
        value: source.value,
        note: source.note,
        tone: source.value === "—" ? "muted" : "info",
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

function getAttendanceSource(
  attendance: QrAttendanceData | null,
  isUnavailable: boolean,
) {
  if (isUnavailable) {
    return {
      value: "—",
      note: "Unavailable",
    };
  }

  if (!attendance) {
    return {
      value: "—",
      note: "No attendance source",
    };
  }

  if (
    attendance.timeOutSource === null
    || attendance.timeInSource === attendance.timeOutSource
  ) {
    return {
      value: attendance.timeInSource,
      note: attendance.timeOutSource
        ? `Time-In and Time-Out via ${attendance.timeInSource}`
        : `Time-In via ${attendance.timeInSource}`,
    };
  }

  return {
    value: "Mixed",
    note: `Time-In: ${attendance.timeInSource}; Time-Out: ${attendance.timeOutSource}`,
  };
}

function formatAttendanceTime(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : formatCampusTime(date);
}
