import type { PayrollVerifiedAttendanceItem } from "@/types/payroll-verified-attendance";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type PayrollVerifiedAttendanceTableProps = {
  records: readonly PayrollVerifiedAttendanceItem[];
  periodLabel: string;
  selectedIds: ReadonlySet<string>;
  allSelectableSelected: boolean;
  onToggleAll: (checked: boolean) => void;
  onToggleRecord: (id: string, checked: boolean) => void;
  onViewDetails: (record: PayrollVerifiedAttendanceItem) => void;
  onAddToBatch: (record: PayrollVerifiedAttendanceItem) => void;
};

function formatAttendanceSummary(item: PayrollVerifiedAttendanceItem) {
  const values: string[] = [];
  const { lateCount, lateMinutes, undertimeMinutes } = item.attendanceSummary;

  if (lateCount !== null) {
    values.push(`Late: ${lateCount}`);
  }

  if (lateMinutes !== null) {
    values.push(`Late minutes: ${lateMinutes}`);
  }

  if (undertimeMinutes !== null) {
    values.push(`Undertime: ${undertimeMinutes}m`);
  }

  return values.length > 0 ? values.join(" · ") : "Unavailable";
}

export function PayrollVerifiedAttendanceTable({
  records,
  periodLabel,
  selectedIds,
  allSelectableSelected,
  onToggleAll,
  onToggleRecord,
  onViewDetails,
  onAddToBatch,
}: PayrollVerifiedAttendanceTableProps) {
  const hasSelectableRecords = records.some((record) => record.selectable);

  return (
    <div className="payroll-verified-attendance__table-wrap">
      <table className="data-table payroll-verified-attendance__table">
        <caption className="sr-only">Attendance records evaluated for Payroll readiness in the selected period</caption>
        <thead>
          <tr>
            <th scope="col">
              <input
                type="checkbox"
                checked={allSelectableSelected}
                onChange={(event) => onToggleAll(event.target.checked)}
                disabled={!hasSelectableRecords}
                aria-label="Select all eligible attendance records"
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
            <tr key={record.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(record.id)}
                  onChange={(event) => onToggleRecord(record.id, event.target.checked)}
                  disabled={!record.selectable}
                  title={record.selectable
                    ? "Select this record for a future batch"
                    : record.payrollReadiness.reasons.map((reason) => `${reason.owner}: ${reason.label}`).join("; ") || "This record is not ready for batching"}
                  aria-label={`Select ${record.employeeName}`}
                />
              </td>
              <td><strong>{record.employeeName}</strong></td>
              <td>{record.employeeId}</td>
              <td>{record.department}</td>
              <td>{record.payrollPeriod.label}</td>
              <td>{record.attendanceSummary.presentDays}</td>
              <td>{formatAttendanceSummary(record)}</td>
              <td><StatusBadge tone={record.hrVerification.status === "verified" ? "success" : "warning"}>
                {record.hrVerification.status === "verified" ? "Verified" : "Pending HR verification"}
              </StatusBadge></td>
              <td>
                <StatusBadge tone={record.payrollReadiness.tone}>
                  {record.payrollReadiness.status === "ready" ? "Ready" : "Blocked"}
                </StatusBadge>
              </td>
              <td><StatusBadge tone={record.batch.tone}>{record.batch.label}</StatusBadge></td>
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
                      <button type="button" onClick={() => onAddToBatch(record)} disabled={!record.selectable} title={record.selectable ? "Create a Draft batch with this record" : "Only Ready for Payroll records can be added."}>
                        Add to batch
                      </button>
                    </div>
                  </details>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={11} className="payroll-verified-attendance__empty">
                <strong>No HR-final-verified attendance records were found for {periodLabel}.</strong>
                <span>Records appear here only after HR final verification is persisted.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

