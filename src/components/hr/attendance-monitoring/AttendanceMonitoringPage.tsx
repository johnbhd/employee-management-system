import { ActionButton } from "@/components/ui/ActionButton";

import { AttendanceMonitoringExplorer } from "./AttendanceMonitoringExplorer";

export function AttendanceMonitoringPage() {
  return (
    <div className="hr-dashboard-page hr-attendance-monitoring-page">
      <header className="hr-dashboard-header">
        <div className="hr-dashboard-heading">
          <p className="hr-dashboard-eyebrow">Attendance operations</p>
          <h1>Attendance Monitoring</h1>
          <p className="hr-dashboard-description">
            Monitor employee attendance records from Bundy and QR sources.
          </p>
        </div>
        <div className="hr-dashboard-actions">
          <ActionButton icon="refresh" action="Attendance monitoring refreshed.">
            Refresh records
          </ActionButton>
        </div>
      </header>

      <AttendanceMonitoringExplorer />
    </div>
  );
}
