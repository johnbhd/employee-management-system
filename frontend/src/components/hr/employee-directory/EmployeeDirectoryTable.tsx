import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

import type { HrEmployeeReference } from "@/data/hr-employee-directory";

type EmployeeDirectoryTableProps = {
  employees: readonly HrEmployeeReference[];
  onSelectEmployee: (employee: HrEmployeeReference) => void;
};

function employmentStatusTone(status: HrEmployeeReference["employmentStatus"]) {
  return status === "Active" ? "success" as const : "muted" as const;
}

function referenceStatusTone(status: HrEmployeeReference["hrpsStatus"]) {
  if (status === "Synchronized") return "success" as const;
  if (status === "Needs Review") return "warning" as const;
  return "danger" as const;
}

export function EmployeeDirectoryTable({ employees, onSelectEmployee }: EmployeeDirectoryTableProps) {
  return (
    <div className="hr-directory-table-scroll">
      <table className="hr-directory-table">
        <caption className="sr-only">HRPS-referenced employee directory</caption>
        <thead>
          <tr>
            <th scope="col">Employee</th>
            <th scope="col">Department</th>
            <th scope="col">Position</th>
            <th scope="col">Employment status</th>
            <th scope="col">Work schedule</th>
            <th scope="col">HRPS status</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>
                <strong className="hr-directory-employee-name">{employee.employeeName}</strong>
                <span className="hr-directory-employee-meta">{employee.employeeId}</span>
              </td>
              <td>{employee.department}</td>
              <td>{employee.position}</td>
              <td><StatusBadge tone={employmentStatusTone(employee.employmentStatus)}>{employee.employmentStatus}</StatusBadge></td>
              <td>
                <strong className="hr-directory-value">{employee.schedule ?? "Schedule Unavailable"}</strong>
                {employee.schedule ? <span className="hr-directory-cell-meta">Monday – Friday</span> : null}
              </td>
              <td><StatusBadge tone={referenceStatusTone(employee.hrpsStatus)}>{employee.hrpsStatus}</StatusBadge></td>
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
              <td colSpan={7} className="hr-directory-empty-row">
                No employee reference records are currently available.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
