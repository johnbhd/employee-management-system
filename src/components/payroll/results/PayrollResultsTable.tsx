import type { PayrollResultRecord } from "@/data/payroll/results";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getPayrollPayslipTone, getPayrollResultTone } from "@/data/payroll/results";

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
            <tr key={record.employeeId}>
              <td><strong>{record.employeeName}</strong></td>
              <td className="payroll-results__reference">{record.employeeId}</td>
              <td>{record.department}</td>
              <td>{record.period}</td>
              <td className={record.reference === "—" ? "" : "payroll-results__reference"}>{record.reference}</td>
              <td><StatusBadge tone={getPayrollResultTone(record.processingStatus)}>{record.processingStatus}</StatusBadge></td>
              <td><StatusBadge tone={getPayrollPayslipTone(record.payslipStatus)}>{record.payslipStatus}</StatusBadge></td>
              <td>{record.releasedAt}</td>
              <td>
                <div className="payroll-results__row-actions">
                  <button type="button" className="button-link" onClick={() => onViewDetails(record)}>View details</button>
                  <details className="payroll-results__row-menu">
                    <summary aria-label={`More actions for ${record.employeeName}`}><Icon name="menu" /></summary>
                    <div>
                      <button type="button" onClick={() => onViewDetails(record)}>View details</button>
                      {record.reference !== "—" ? <button type="button" onClick={() => onCopyReference(record)}>Copy reference</button> : null}
                    </div>
                  </details>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={9} className="payroll-results__empty">
                <strong>No payroll result records match your filters.</strong>
                <span>Clear a filter to return to the available result records.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
