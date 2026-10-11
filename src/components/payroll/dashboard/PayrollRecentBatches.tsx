import type { PayrollBatch } from "@/data/payroll/dashboard";

import { StatusBadge } from "@/components/ui/StatusBadge";

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
          {batches.map((batch) => (
            <tr key={batch.id}>
              <td><strong>{batch.id}</strong></td>
              <td>{batch.payrollPeriod}</td>
              <td>{batch.employees}</td>
              <td>{batch.createdBy}</td>
              <td><StatusBadge tone={batch.transferTone}>{batch.transferStatus}</StatusBadge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
