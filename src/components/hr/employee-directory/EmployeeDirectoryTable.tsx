import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { EmployeeReference } from "@/types/employee";

type EmployeeDirectoryTableProps = {
    employees: readonly EmployeeReference[];
    onSelectEmployee: (employee: EmployeeReference) => void;
};

function employmentStatusTone(status: EmployeeReference["employmentStatus"]) {
    return status === "active" ? "success" as const : "muted" as const;
}

function employmentStatusLabel(status: EmployeeReference["employmentStatus"]) {
    return status === "active" ? "Active" : "Inactive";
}

export function EmployeeDirectoryTable({
    employees,
    onSelectEmployee,
}: EmployeeDirectoryTableProps) {
    return (
        <div className="hr-directory-table-scroll">
            <table className="hr-directory-table">
                <caption className="sr-only">HR-referenced employee directory</caption>
                <thead>
                    <tr>
                        <th scope="col">Employee</th>
                        <th scope="col">Department</th>
                        <th scope="col">Position</th>
                        <th scope="col">Employment status</th>
                        <th scope="col">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((employee) => (
                        <tr key={employee.employeeId}>
                            <td>
                                <strong className="hr-directory-employee-name">{employee.displayName}</strong>
                                <span className="hr-directory-employee-meta">{employee.employeeId}</span>
                            </td>
                            <td>{employee.department}</td>
                            <td>{employee.position ?? "—"}</td>
                            <td>
                                <StatusBadge tone={employmentStatusTone(employee.employmentStatus)}>
                                    {employmentStatusLabel(employee.employmentStatus)}
                                </StatusBadge>
                            </td>
                            <td>
                                <button
                                    type="button"
                                    className="button-secondary hr-directory-view-button"
                                    onClick={() => onSelectEmployee(employee)}
                                >
                                    <Icon name="users" />
                                    View details
                                </button>
                            </td>
                        </tr>
                    ))}
                    {employees.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="hr-directory-empty-row">
                                No employee reference records are currently available.
                            </td>
                        </tr>
                    ) : null}
                </tbody>
            </table>
        </div>
    );
}
