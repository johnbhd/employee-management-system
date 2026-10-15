
import type { PayrollBatchResult } from "@/data/payroll/results";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatPayrollResultDateTime,
  getPayrollResultStatusLabel,
  getPayrollResultStatusTone,
} from "@/data/payroll/results";

type PayrollBatchResultsTableProps = {
  batches: readonly PayrollBatchResult[];
  onViewDetails: (batch: PayrollBatchResult) => void;
};

export function PayrollBatchResultsTable({ batches, onViewDetails }: PayrollBatchResultsTableProps) {
  return (
    <div className="payroll-results__batch-table-wrap">
      <table className="data-table payroll-results__batch-table">
        <caption className="sr-only">Latest payroll batch results</caption>
        <thead>
          <tr>
            <th scope="col">Batch ID</th>
            <th scope="col">Payroll period</th>
            <th scope="col">Employees</th>
            <th scope="col">Returned at</th>
            <th scope="col">Result status</th>
            <th scope="col">Payslips</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {batches.length > 0 ? batches.map((batch) => (
            <tr key={batch.resultId}>
              <td><strong>{batch.id}</strong></td>
              <td>{batch.period.label}</td>
              <td>{batch.employees}</td>
              <td>{formatPayrollResultDateTime(batch.returnedAt)}</td>
              <td><StatusBadge tone={getPayrollResultStatusTone(batch.resultStatus)}>{getPayrollResultStatusLabel(batch.resultStatus)}</StatusBadge></td>
              <td>{batch.payslipsAvailable} / {batch.employees}</td>
              <td>
                <button type="button" className="button-link" onClick={() => onViewDetails(batch)}>
                  <Icon name="file" /> View details
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={7} className="payroll-results__empty">
                <strong>No returned batch results yet.</strong>
                <span>Completed Payroll handoffs will be summarized here.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
