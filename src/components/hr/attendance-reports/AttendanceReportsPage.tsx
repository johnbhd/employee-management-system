import type { AttendanceReportsData } from "@/server/hr/attendance-reports.service";
import type { AttendanceReportsQuery } from "@/server/hr/attendance-reports-query";

import { AttendanceReportsExplorer } from "./AttendanceReportsExplorer";

type AttendanceReportsPageProps = {
  data: AttendanceReportsData;
  query: AttendanceReportsQuery;
  defaultDate: string;
  loadError?: boolean;
};

export function AttendanceReportsPage({
  data,
  query,
  defaultDate,
  loadError = false,
}: AttendanceReportsPageProps) {
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

      <AttendanceReportsExplorer
        data={data}
        query={query}
        defaultDate={defaultDate}
        loadError={loadError}
      />
    </div>
  );
}
