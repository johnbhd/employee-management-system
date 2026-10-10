import type { EmployeeScheduleItem } from "@/types/hr-employee-schedule";

import { EmployeeSchedulesExplorer } from "./EmployeeSchedulesExplorer";

type EmployeeSchedulesPageProps = {
  records: readonly EmployeeScheduleItem[];
  loadError?: boolean;
};

export function EmployeeSchedulesPage({
  records,
  loadError = false,
}: EmployeeSchedulesPageProps) {
  return (
    <div className="hr-dashboard-page hr-employee-schedules-page">
      <header className="hr-dashboard-header">
        <div className="hr-dashboard-heading">
          <p className="hr-dashboard-eyebrow">Attendance operations</p>
          <h1>Employee Schedules</h1>
          <p className="hr-dashboard-description">
            View read-only HRPS reference schedules used by attendance operations.
          </p>
        </div>
      </header>

      <EmployeeSchedulesExplorer records={records} loadError={loadError} />
    </div>
  );
}
