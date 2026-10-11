import type { PayrollReadinessRecord } from "@/data/payroll/dashboard";

import { StatusBadge } from "@/components/ui/StatusBadge";

export function PayrollReadinessTable({
  records,
}: {
  records: readonly PayrollReadinessRecord[];
}) {
  return (
    <div className="payroll-dashboard__table-wrap">
      <table className="data-table payroll-dashboard__table">
        <caption className="sr-only">HR-verified attendance records prepared for Payroll handoff</caption>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th>Payroll period</th>
            <th>Attendance</th>
            <th>Verification</th>
            <th>Payroll readiness</th>
            <th>Batch status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.employeeId}>
              <td>
                <strong>{record.employeeName}</strong>
                <small className="payroll-dashboard__table-reference">{record.employeeId}</small>
              </td>
              <td>{record.department}</td>
              <td>{record.payrollPeriod}</td>
              <td><StatusBadge tone={record.attendanceTone}>{record.attendanceStatus}</StatusBadge></td>
              <td><StatusBadge tone={record.verificationTone}>{record.verification}</StatusBadge></td>
              <td><StatusBadge tone={record.payrollReadinessTone}>{record.payrollReadiness}</StatusBadge></td>
              <td><StatusBadge tone={record.batchTone}>{record.batchStatus}</StatusBadge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
