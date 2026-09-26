import { ActionButton } from "@/components/ui/ActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { payrollRebuildAttendance } from "@/data/payroll-integration-rebuild";

export function PayrollIntegrationTable() {
  return (
    <div className="payroll-rebuild-table-wrap">
      <table className="data-table payroll-rebuild-table">
        <caption className="sr-only">Verified attendance records prepared for Payroll transfer</caption>
        <thead>
          <tr>
            <th scope="col">Employee ID</th>
            <th scope="col">Employee</th>
            <th scope="col">Department</th>
            <th scope="col">Records</th>
            <th scope="col">Verification</th>
            <th scope="col">Readiness</th>
            <th scope="col">Transfer</th>
            <th scope="col"><span className="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          {payrollRebuildAttendance.map((record) => (
            <tr key={record.employeeId}>
              <td>{record.employeeId}</td>
              <td>
                <strong className="payroll-rebuild-employee">{record.employee}</strong>
              </td>
              <td>{record.department}</td>
              <td>{record.records}</td>
              <td>
                <StatusBadge tone={record.verification.tone}>{record.verification.label}</StatusBadge>
              </td>
              <td>
                <StatusBadge tone={record.readiness.tone}>{record.readiness.label}</StatusBadge>
              </td>
              <td>
                <StatusBadge tone={record.transfer.tone}>{record.transfer.label}</StatusBadge>
              </td>
              <td>
                <ActionButton
                  variant="link"
                  icon="file"
                  action={`${record.employeeId} attendance details opened in prototype mode.`}
                >
                  View
                </ActionButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
