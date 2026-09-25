import { hrEmployeeSchedules } from "@/data/hr-employee-schedules";

import { EmployeeSchedulesExplorer } from "./EmployeeSchedulesExplorer";

export function EmployeeSchedulesPage() {
  return (
    <div className="hr-dashboard-page hr-employee-schedules-page">
      <header className="hr-dashboard-header">
        <div className="hr-dashboard-heading">
          <p className="hr-dashboard-eyebrow">Attendance operations</p>
          <h1>Employee Schedules</h1>
          <p className="hr-dashboard-description">
            View HRPS-referenced employee work schedules used for attendance validation and processing.
          </p>
        </div>
      </header>

      <EmployeeSchedulesExplorer records={hrEmployeeSchedules} />
    </div>
  );
}
