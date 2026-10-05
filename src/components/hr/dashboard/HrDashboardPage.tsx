import { formatCampusDateKeyLabel } from "@/lib/campus-time";
import type { HrDashboardSummary } from "@/types/hr-dashboard";
import type { HrPendingAction, HrSummaryMetric } from "@/data/hr";

import { HrAttendanceSummary } from "./HrAttendanceSummary";
import { HrDashboardRefreshButton } from "./HrDashboardRefreshButton";
import { HrPendingActions } from "./HrPendingActions";
import { HrRecentIssues } from "./HrRecentIssues";
import { HrTodayAttendance } from "./HrTodayAttendance";

export function HrDashboardPage({
  dataLoadError,
  summary,
}: {
  dataLoadError: boolean;
  summary: HrDashboardSummary | null;
}) {
  const summaryMetrics = getSummaryMetrics(summary, dataLoadError);
  const pendingActions = getPendingActions(summary, dataLoadError);
  const dashboardDate = summary
    ? formatCampusDateKeyLabel(summary.attendanceDate, "long")
    : "Current attendance date unavailable";

  return (
    <div className="hr-dashboard-page">
      <header className="hr-dashboard-header">
        <div className="hr-dashboard-heading">
          <p className="hr-dashboard-eyebrow">Attendance operations</p>
          <h1>HR / Attendance Dashboard</h1>
          <p className="hr-dashboard-description">
            Monitor the real current-day attendance summary and operational records.
          </p>
          <p className="hr-dashboard-date">{dashboardDate}</p>
          {dataLoadError ? (
            <p className="hr-dashboard-data-error" role="alert">
              Unable to load current attendance summary. Please try again.
            </p>
          ) : null}
        </div>
        <div className="hr-dashboard-actions">
          <HrDashboardRefreshButton />
        </div>
      </header>

      <HrAttendanceSummary metrics={summaryMetrics} />

      <HrTodayAttendance
        dataLoadError={dataLoadError}
        records={summary?.attendanceRecords.slice(0, 5) ?? []}
      />

      <div className="hr-dashboard-lower-grid">
        <HrPendingActions actions={pendingActions} />
        <HrRecentIssues
          dataLoadError={dataLoadError}
          issues={summary?.recentIssues ?? []}
        />
      </div>
    </div>
  );
}

function getSummaryMetrics(
  summary: HrDashboardSummary | null,
  dataLoadError: boolean,
): HrSummaryMetric[] {
  if (dataLoadError || !summary) {
    return [
      {
        label: "Active Employees",
        value: "—",
        note: "Unavailable",
        icon: "users",
        tone: "info",
      },
      {
        label: "Timed In Today",
        value: "—",
        note: "Unavailable",
        icon: "check",
        tone: "success",
      },
      {
        label: "Completed Today",
        value: "—",
        note: "Unavailable",
        icon: "activity",
        tone: "info",
      },
      {
        label: "Awaiting Time-Out",
        value: "—",
        note: "Unavailable",
        icon: "warning",
        tone: "warning",
      },
      {
        label: "Pending Corrections",
        value: "—",
        note: "Not connected",
        icon: "comment",
        tone: "info",
      },
      {
        label: "Pending Verification",
        value: "—",
        note: "Not connected",
        icon: "activity",
        tone: "warning",
      },
    ];
  }

  return [
    {
      label: "Active Employees",
      value: String(summary.activeEmployees),
      note: "Employee references",
      icon: "users",
      tone: "info",
    },
    {
      label: "Timed In Today",
      value: String(summary.timedInToday),
      note: "Time-In recorded",
      icon: "check",
      tone: "success",
    },
    {
      label: "Completed Today",
      value: String(summary.completedToday),
      note: "Time-Out recorded",
      icon: "activity",
      tone: "info",
    },
    {
      label: "Awaiting Time-Out",
      value: String(summary.awaitingTimeOut),
      note: "Time-Out still pending",
      icon: "warning",
      tone: "warning",
    },
    {
      label: "Pending Corrections",
      value: "—",
      note: "Not connected",
      icon: "comment",
      tone: "info",
    },
    {
      label: "Pending Verification",
      value: "—",
      note: "Not connected",
      icon: "activity",
      tone: "warning",
    },
  ];
}

function getPendingActions(
  summary: HrDashboardSummary | null,
  dataLoadError: boolean,
): HrPendingAction[] {
  if (dataLoadError || !summary) {
    return [
      {
        label: "Current Attendance",
        count: "—",
        note: "Unavailable",
        icon: "warning",
        tone: "warning",
      },
    ];
  }

  return [
    {
      label: "Awaiting Time-Out",
      count: String(summary.awaitingTimeOut),
      note: "Current-day records",
      icon: "warning",
      tone: "warning",
    },
  ];
}
