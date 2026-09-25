import { hrEmployeeDirectory } from "@/data/hr-employee-directory";

import { EmployeeDirectoryExplorer } from "./EmployeeDirectoryExplorer";

export function EmployeeDirectoryPage() {
  return (
    <div className="hr-dashboard-page hr-employee-directory-page">
      <header className="hr-dashboard-header">
        <div className="hr-dashboard-heading">
          <p className="hr-dashboard-eyebrow">Employee reference</p>
          <h1>Employee Directory</h1>
          <p className="hr-dashboard-description">
            View HRPS-referenced employee information used across attendance operations.
          </p>
        </div>
      </header>

      <EmployeeDirectoryExplorer employees={hrEmployeeDirectory} />
    </div>
  );
}
