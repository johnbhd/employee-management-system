import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PayrollBatch } from "@/types/payroll-dashboard";

export function PayrollRecentBatches({ batches }: { batches: readonly PayrollBatch[] }) {
  return (
    <div className="payroll-dashboard__table-wrap">
      <table className="data-table payroll-dashboard__table payroll-dashboard__batch-table">
        <caption className="sr-only">Recent Payroll batches and transfer statuses</caption>
        <thead>
          <tr>
            <th>Batch</th>
            <th>Payroll period</th>
            <th>Employees</th>
            <th>Created by</th>
            <th>Transfer</th>
          </tr>
        </thead>
        <tbody>
          {batches.length > 0 ? batches.map((batch) => (
              <tr key={batch.id}>
                <td><strong>{batch.id}</strong></td>
                <td>{batch.payrollPeriod}</td>
                <td>{batch.employees}</td>
                <td>{batch.createdBy}</td>
                <td><StatusBadge tone={batch.transferTone}>{batch.transferStatus}</StatusBadge></td>
              </tr>
          )) : (
            <tr>
              <td colSpan={5} className="payroll-dashboard__empty-cell">
                No payroll batches have been created for the current period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
