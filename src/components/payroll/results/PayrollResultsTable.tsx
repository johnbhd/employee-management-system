import type { PayrollResultRecord } from "@/data/payroll/results";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatPayrollResultDate,
  getPayrollPayslipLabel,
  getPayrollPayslipTone,
  getPayrollResultLabel,
  getPayrollResultTone,
} from "@/data/payroll/results";

type PayrollResultsTableProps = {
  records: readonly PayrollResultRecord[];
  onViewDetails: (record: PayrollResultRecord) => void;
  onCopyReference: (record: PayrollResultRecord) => void;
};

export function PayrollResultsTable({ records, onViewDetails, onCopyReference }: PayrollResultsTableProps) {
  return (
    <div className="payroll-results__table-wrap">
      <table className="data-table payroll-results__table">
        <caption className="sr-only">Employee payroll result records</caption>
        <thead>
          <tr>
            <th scope="col">Employee</th>
            <th scope="col">Employee ID</th>
            <th scope="col">Department</th>
            <th scope="col">Payroll period</th>
            <th scope="col">Payroll reference</th>
            <th scope="col">Processing status</th>
            <th scope="col">Payslip status</th>
            <th scope="col">Date released</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length > 0 ? records.map((record) => (
            <tr key={record.id}>
              <td><strong>{record.employeeName}</strong></td>
              <td className="payroll-results__reference">{record.employeeId}</td>
              <td>{record.department}</td>
              <td>{record.period.label}</td>
              <td className={record.externalPayrollReference ? "payroll-results__reference" : ""}>{record.externalPayrollReference ?? "—"}</td>
              <td><StatusBadge tone={getPayrollResultTone(record.processingStatus)}>{getPayrollResultLabel(record.processingStatus)}</StatusBadge></td>
              <td><StatusBadge tone={getPayrollPayslipTone(record.payslipStatus)}>{getPayrollPayslipLabel(record.payslipStatus)}</StatusBadge></td>
              <td>{formatPayrollResultDate(record.releasedAt)}</td>
              <td>
                <div className="payroll-results__row-actions">
                  <button type="button" className="button-link" onClick={() => onViewDetails(record)}>View details</button>
                  <details className="payroll-results__row-menu">
                    <summary aria-label={`More actions for ${record.employeeName}`}><Icon name="menu" /></summary>
                    <div>
                      <button type="button" onClick={() => onViewDetails(record)}>View details</button>
                      {record.externalPayrollReference ? <button type="button" onClick={() => onCopyReference(record)}>Copy reference</button> : null}
                    </div>
                  </details>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={9} className="payroll-results__empty">
                <strong>No payroll result records match your filters.</strong>
                <span>Returned results will appear here after a Payroll handoff is processed.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
