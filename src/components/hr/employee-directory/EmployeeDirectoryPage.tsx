import type { EmployeeReference } from "@/types/employee";

import { EmployeeDirectoryExplorer } from "./EmployeeDirectoryExplorer";

type EmployeeDirectoryPageProps = {
    employees: EmployeeReference[];
    loadError?: boolean;
};

export function EmployeeDirectoryPage({
    employees,
    loadError = false,
}: EmployeeDirectoryPageProps) {
    return (
        <div className="hr-dashboard-page hr-employee-directory-page">
            <header className="hr-dashboard-header">
                <div className="hr-dashboard-heading">
                    <p className="hr-dashboard-eyebrow">Employee reference</p>
                    <h1>Employee Directory</h1>
                    <p className="hr-dashboard-description">
                        View read-only Employee reference information used across attendance operations.
                    </p>
                </div>
            </header>

            <EmployeeDirectoryExplorer
                employees={employees}
                loadError={loadError}
            />
        </div>
    );
}
