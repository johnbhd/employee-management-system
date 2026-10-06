import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { getLatestAnnouncements } from "@/data/employee";
import { getEmployeeDashboardData } from "@/data/employee-dashboard";
import {
  formatCampusDateKey,
  formatCampusDateKeyLabel,
} from "@/lib/campus-time";
import {
  formatAttendanceTime,
  unavailableAttendanceValue,
} from "@/lib/employee/today-attendance";
import { defaultAttendanceHistoryQuery } from "@/server/attendance/attendance-history-query";
import {
  getAttendanceHistoryForEmployee,
  getTodayAttendanceForEmployee,
} from "@/server/attendance/attendance.service";
import type { AttendanceHistoryData } from "@/types/attendance-history";
import type { AttendanceHistoryRecordData } from "@/types/attendance-history";
import type { EmployeeReference } from "@/types/employee";
import type { StatusTone } from "@/types/ui";
import type { TodayAttendanceData } from "@/types/attendance-qr";

import { EmployeeDashboardAttendanceCard } from "./EmployeeDashboardAttendanceCard";
import { EmployeeDashboardWelcome } from "./EmployeeDashboardWelcome";

export function EmployeeDashboardPageUnavailable() {
  return (
    <div className="employee-dashboard-page">
      <section
        className="employee-panel employee-dashboard-unavailable"
        role="alert"
        aria-labelledby="employee-dashboard-unavailable-heading"
      >
        <p className="employee-section-kicker">Employee profile</p>
        <h2 id="employee-dashboard-unavailable-heading">
          Employee information is currently unavailable.
        </h2>
        <p>
          Please contact the system administrator to restore your employee
          account reference.
        </p>
      </section>
    </div>
  );
}

export async function EmployeeDashboardPage({
  employee,
}: {
  employee: EmployeeReference;
}) {
  const dashboardData = getEmployeeDashboardData(employee.employeeId);
  const latestAnnouncements = getLatestAnnouncements(3);
  const now = new Date();
  const fallbackTodayAttendance: TodayAttendanceData = {
    attendance: null,
    attendanceDate: formatCampusDateKey(now),
  };
  let todayAttendance = fallbackTodayAttendance;
  let attendanceLoadError = false;
  let attendanceHistoryData: AttendanceHistoryData | null = null;
  let attendanceHistory: DashboardAttendanceRecord[] = [];
  let attendanceHistoryLoadError = false;

  try {
    todayAttendance = await getTodayAttendanceForEmployee(
      employee.employeeId,
      now,
    );
  } catch {
    attendanceLoadError = true;
  }

  try {
    const historyData = await getAttendanceHistoryForEmployee(
      employee.employeeId,
      defaultAttendanceHistoryQuery,
    );
    attendanceHistoryData = historyData;
    attendanceHistory = historyData.records
      .slice(0, 5)
      .map(toDashboardAttendanceRecord);
  } catch {
    attendanceHistoryLoadError = true;
  }

  const dashboardStats = dashboardData.stats.map((stat) => {
    if (stat.label !== "Days Present") {
      return stat;
    }

    if (attendanceHistoryData) {
      return {
        ...stat,
        value: String(attendanceHistoryData.totalRecords),
        note:
          attendanceHistoryData.totalRecords > 0
            ? "All available records"
            : "No records",
      };
    }

    if (attendanceHistoryLoadError) {
      return {
        ...stat,
        value: todayAttendance.attendance
          ? "1"
          : unavailableAttendanceValue,
        note: todayAttendance.attendance ? "Today's record" : "Unavailable",
      };
    }

    return stat;
  });

  return (
    <div className="employee-dashboard-page">
      <EmployeeDashboardWelcome employee={employee} />

      <EmployeeDashboardAttendanceCard
        attendanceLoadError={attendanceLoadError}
        todayAttendance={todayAttendance}
      />

      <section
        className="employee-summary-panel"
        aria-labelledby="employee-summary-heading"
      >
        <div className="employee-summary-heading">
          <div>
            <p className="employee-section-kicker">Attendance summary</p>
            <h2 id="employee-summary-heading">Attendance overview</h2>
          </div>
          <span className="employee-summary-period">Available records</span>
        </div>
        <div className="employee-summary-grid">
          {dashboardStats.map((stat) => (
            <SummaryCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="employee-panel employee-recent-panel">
        <div className="employee-panel-heading">
          <div>
            <p className="employee-section-kicker">Recent records</p>
            <h2>Attendance history</h2>
          </div>
          <Link
            href="/employee/attendance-history"
            className="employee-text-button"
          >
            View all <Icon name="arrow" />
          </Link>
        </div>
        <div className="table-wrap employee-table-wrap">
          <table className="data-table employee-data-table">
            <caption className="sr-only">
              Recent employee attendance history
            </caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time in</th>
                <th>Time out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistoryLoadError ? (
                <tr>
                  <td className="employee-table-empty" colSpan={5}>
                    Unable to load attendance history. Please try again.
                  </td>
                </tr>
              ) : attendanceHistory.length > 0 ? (
                attendanceHistory.map((record) => (
                  <tr key={record.date}>
                    <td>{record.date}</td>
                    <td>{record.timeIn}</td>
                    <td>{record.timeOut}</td>
                    <td>{record.hours}</td>
                    <td>
                      <StatusBadge tone={record.tone}>
                        {record.status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="employee-table-empty" colSpan={5}>
                    No attendance records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="employee-bottom-grid">
        <section className="employee-panel payroll-card">
          <div className="employee-panel-heading">
            <div>
              <p className="employee-section-kicker">Payroll</p>
              <h2>Latest payslip</h2>
            </div>
            <Icon name="payroll" />
          </div>
          {dashboardData.latestPayslip ? (
            <>
              <p className="payroll-period">
                {dashboardData.latestPayslip.period}
              </p>
              <strong className="payroll-amount">
                {dashboardData.latestPayslip.amount}
              </strong>
              <div className="payroll-meta">
                <span>{dashboardData.latestPayslip.releasedDate}</span>
                <StatusBadge tone="success">Available</StatusBadge>
              </div>
            </>
          ) : (
            <p className="payroll-empty-state">No payslip available.</p>
          )}
          <Link
            href="/employee/payslips"
            className="employee-secondary-button full-width"
          >
            <Icon name="file" />
            View payslip
          </Link>
        </section>

        <section className="employee-panel announcements-card">
          <div className="employee-panel-heading">
            <div>
              <p className="employee-section-kicker">Campus updates</p>
              <h2>Announcements</h2>
            </div>
            <Link
              href="/employee/announcements"
              className="employee-text-button"
            >
              View all <Icon name="arrow" />
            </Link>
          </div>
          <div className="announcement-list">
            {latestAnnouncements.map((announcement) => (
              <article className="announcement-item" key={announcement.id}>
                <div className={`announcement-icon ${announcement.tone}`}>
                  <Icon name="info" />
                </div>
                <div>
                  <div className="announcement-meta">
                    <StatusBadge tone={announcement.tone}>
                      {announcement.category}
                    </StatusBadge>
                    <time>{announcement.date}</time>
                  </div>
                  <h3>{announcement.title}</h3>
                  <p>{announcement.message}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

type DashboardAttendanceRecord = {
  date: string;
  timeIn: string;
  timeOut: string;
  hours: string;
  status: string;
  tone: StatusTone;
};

function toDashboardAttendanceRecord(
  record: AttendanceHistoryRecordData,
): DashboardAttendanceRecord {
  return {
    date: formatCampusDateKeyLabel(record.date),
    timeIn: formatAttendanceTime(record.timeIn),
    timeOut: formatAttendanceTime(record.timeOut),
    hours: unavailableAttendanceValue,
    status: record.status === "completed" ? "Completed" : "Present",
    tone: record.status === "completed" ? "success" : "info",
  };
}
