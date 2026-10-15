import type { AccountingDashboardPayroll } from "@/types/accounting-dashboard";

import { formatAccountingReturnedAmount } from "@/data/accounting/approved-payroll";
import { StatusBadge } from "@/components/ui/StatusBadge";

import { AccountingBatchDetails } from "./AccountingBatchDetails";
import { getAccountingStatusTone } from "./LatestApprovedPayroll";

type RecentPayrollBatchesProps = {
  batches: readonly AccountingDashboardPayroll[];
};

export function RecentPayrollBatches({ batches }: RecentPayrollBatchesProps) {
  if (batches.length === 0) {
    return (
      <p className="accounting-dashboard__empty-state">
        No Payroll Results are available yet.
      </p>
    );
  }

  return (
    <div className="accounting-dashboard__table-wrap">
      <table className="data-table accounting-dashboard__table">
        <caption className="sr-only">Recent Payroll Results</caption>
        <thead>
          <tr>
            <th>Payroll period</th>
            <th>Employees</th>
            <th>Returned amount</th>
            <th>Payroll result</th>
            <th>Accounting</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch.payrollResultId}>
              <td>
                <strong>{batch.payrollPeriod.label}</strong>
                <small className="accounting-dashboard__table-reference">{batch.payrollReference}</small>
              </td>
              <td>{batch.employeeCount}</td>
              <td>{formatAccountingReturnedAmount(batch.returnedAmount)}</td>
              <td>
                <StatusBadge tone={getPayrollStatusTone(batch.payrollStatus)}>
                  {getPayrollStatusLabel(batch.payrollStatus)}
                </StatusBadge>
              </td>
              <td>
                <StatusBadge tone={getAccountingStatusTone(batch.accountingStatus)}>
                  {batch.accountingStatus}
                </StatusBadge>
              </td>
              <td><AccountingBatchDetails batch={batch} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getPayrollStatusLabel(status: AccountingDashboardPayroll["payrollStatus"]) {
  switch (status) {
    case "completed":
      return "Completed";
    case "completed_with_issues":
      return "Completed with issues";
    case "partially_completed":
      return "Partially completed";
    case "processing":
      return "Processing";
    case "rejected":
      return "Rejected";
    case "failed":
      return "Failed";
  }
}

function getPayrollStatusTone(status: AccountingDashboardPayroll["payrollStatus"]) {
  if (status === "completed") return "success" as const;
  if (status === "processing") return "warning" as const;
  return "danger" as const;
}
