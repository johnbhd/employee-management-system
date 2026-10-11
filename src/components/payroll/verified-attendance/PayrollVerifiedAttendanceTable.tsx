import type { PayrollVerifiedAttendanceRecord } from "@/data/payroll/verified-attendance";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type PayrollVerifiedAttendanceTableProps = {
  records: readonly PayrollVerifiedAttendanceRecord[];
  selectedIds: ReadonlySet<string>;
  onToggleAll: (checked: boolean) => void;
  onToggleRecord: (employeeId: string, checked: boolean) => void;
  onViewDetails: (record: PayrollVerifiedAttendanceRecord) => void;
  onAddToBatch: (record: PayrollVerifiedAttendanceRecord) => void;
  onMarkReview: (record: PayrollVerifiedAttendanceRecord) => void;
};

export function PayrollVerifiedAttendanceTable({
  records,
  selectedIds,
  onToggleAll,
  onToggleRecord,
  onViewDetails,
  onAddToBatch,
  onMarkReview,
}: PayrollVerifiedAttendanceTableProps) {
  const allSelected = records.length > 0 && records.every((record) => selectedIds.has(record.employeeId));

  return (
    <div className="payroll-verified-attendance__table-wrap">
      <table className="data-table payroll-verified-attendance__table">
        <caption className="sr-only">HR-verified attendance records for the selected payroll period</caption>
        <thead>
          <tr>
            <th scope="col">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) => onToggleAll(event.target.checked)}
                aria-label="Select all visible attendance records"
              />
            </th>
            <th scope="col">Employee</th>
            <th scope="col">Employee ID</th>
            <th scope="col">Department</th>
            <th scope="col">Payroll period</th>
            <th scope="col">Days present</th>
            <th scope="col">Late / undertime</th>
            <th scope="col">Verification</th>
            <th scope="col">Payroll readiness</th>
            <th scope="col">Batch status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length > 0 ? records.map((record) => (
            <tr key={record.employeeId}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(record.employeeId)}
                  onChange={(event) => onToggleRecord(record.employeeId, event.target.checked)}
                  aria-label={`Select ${record.employeeName}`}
                />
              </td>
              <td><strong>{record.employeeName}</strong></td>
              <td>{record.employeeId}</td>
              <td>{record.department}</td>
              <td>{record.payrollPeriod}</td>
              <td>{record.daysPresent}</td>
              <td>{record.lateUndertime}</td>
              <td><StatusBadge tone={record.verificationTone}>{record.verification}</StatusBadge></td>
              <td><StatusBadge tone={record.readinessTone}>{record.readiness}</StatusBadge></td>
              <td><StatusBadge tone={record.batchTone}>{record.batchStatus}</StatusBadge></td>
              <td>
                <div className="payroll-verified-attendance__row-actions">
                  <button type="button" className="button-link" onClick={() => onViewDetails(record)}>
                    View details
                  </button>
                  <details className="payroll-verified-attendance__row-menu">
                    <summary aria-label={`More actions for ${record.employeeName}`}>
                      <Icon name="menu" />
                    </summary>
                    <div>
                      <button type="button" onClick={() => onViewDetails(record)}>View details</button>
                      <button type="button" onClick={() => onAddToBatch(record)}>Add to batch</button>
                      <button type="button" onClick={() => onMarkReview(record)}>Mark for review</button>
                    </div>
                  </details>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={11} className="payroll-verified-attendance__empty">
                <strong>No attendance records match these filters.</strong>
                <span>Clear a filter to return to the selected payroll-period records.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

