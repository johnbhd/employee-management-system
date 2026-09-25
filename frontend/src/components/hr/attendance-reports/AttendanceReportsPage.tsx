import { hrCorrectionRequests } from "@/data/hr-correction-requests";
import { hrAttendanceReportRecords } from "@/data/hr-attendance-reports";

import { AttendanceReportsExplorer } from "./AttendanceReportsExplorer";

export function AttendanceReportsPage() {
  return (
    <div className="hr-dashboard-page hr-attendance-reports-page">
      <header className="hr-dashboard-header">
        <div className="hr-dashboard-heading">
          <p className="hr-dashboard-eyebrow">Attendance operations</p>
          <h1>Attendance Reports</h1>
          <p className="hr-dashboard-description">
            Review attendance summaries, exceptions, source usage, and correction activity across employees.
          </p>
        </div>
      </header>

      <AttendanceReportsExplorer records={hrAttendanceReportRecords} correctionRequests={hrCorrectionRequests} />
    </div>
  );
}
