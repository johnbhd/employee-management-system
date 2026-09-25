import { ActionButton } from "@/components/ui/ActionButton";
import {
  hrDashboardDate,
  hrPendingActions,
  hrRecentIssues,
  hrSummaryMetrics,
  hrTodayAttendance,
} from "@/data/hr";

import { HrAttendanceSummary } from "./HrAttendanceSummary";
import { HrPendingActions } from "./HrPendingActions";
import { HrRecentIssues } from "./HrRecentIssues";
import { HrTodayAttendance } from "./HrTodayAttendance";

export function HrDashboardPage() {
  return (
    <div className="hr-dashboard-page">
      <header className="hr-dashboard-header">
        <div className="hr-dashboard-heading">
          <p className="hr-dashboard-eyebrow">Attendance operations</p>
          <h1>HR / Attendance Dashboard</h1>
          <p className="hr-dashboard-description">
            Monitor employee attendance, exceptions, corrections, and attendance readiness.
          </p>
          <p className="hr-dashboard-date">{hrDashboardDate} · Prototype workspace</p>
        </div>
        <div className="hr-dashboard-actions">
          <ActionButton icon="refresh" action="Attendance summary refreshed in the prototype.">
            Refresh data
          </ActionButton>
        </div>
      </header>

      <HrAttendanceSummary metrics={hrSummaryMetrics} />

      <HrTodayAttendance records={hrTodayAttendance} />

      <div className="hr-dashboard-lower-grid">
        <HrPendingActions actions={hrPendingActions} />
        <HrRecentIssues issues={hrRecentIssues} />
      </div>
    </div>
  );
}
