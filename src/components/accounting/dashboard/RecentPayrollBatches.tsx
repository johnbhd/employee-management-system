import type { AccountingPayrollBatch } from "@/data/accounting/dashboard";

import { AccountingBatchDetails } from "./AccountingBatchDetails";
import { StatusBadge } from "@/components/ui/StatusBadge";

type RecentPayrollBatchesProps = {
  batches: readonly AccountingPayrollBatch[];
};

export function RecentPayrollBatches({ batches }: RecentPayrollBatchesProps) {
  return (
    <div className="accounting-dashboard__table-wrap">
      <table className="data-table accounting-dashboard__table">
        <caption className="sr-only">Recent approved payroll batches</caption>
        <thead>
          <tr>
            <th>Payroll period</th>
            <th>Employees</th>
            <th>Approved amount</th>
            <th>Approval</th>
            <th>Accounting</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch.payrollReference}>
              <td>
                <strong>{batch.payrollPeriod}</strong>
                <small className="accounting-dashboard__table-reference">{batch.payrollReference}</small>
              </td>
              <td>{batch.employeeCount}</td>
              <td>{batch.approvedAmount}</td>
              <td><StatusBadge tone={batch.approvalTone}>{batch.approvalStatus}</StatusBadge></td>
              <td><StatusBadge tone={batch.accountingTone}>{batch.accountingStatus}</StatusBadge></td>
              <td><AccountingBatchDetails batch={batch} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
