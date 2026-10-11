import type { AccountingPayrollBatch } from "@/data/accounting/dashboard";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ApprovedPayrollTableProps = {
  batches: readonly AccountingPayrollBatch[];
  onViewDetails: (batch: AccountingPayrollBatch) => void;
};

export function ApprovedPayrollTable({ batches, onViewDetails }: ApprovedPayrollTableProps) {
  return (
    <div className="accounting-approved-payroll__table-wrap">
      <table className="data-table accounting-approved-payroll__table">
        <caption className="sr-only">Approved payroll information records</caption>
        <thead>
          <tr>
            <th scope="col">Payroll period</th>
            <th scope="col">Payroll reference</th>
            <th scope="col">Employees</th>
            <th scope="col">Approved amount</th>
            <th scope="col">Approval status</th>
            <th scope="col">Accounting status</th>
            <th scope="col">Transfer reference</th>
            <th scope="col">Last updated</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {batches.length > 0 ? batches.map((batch) => (
            <tr key={batch.payrollReference}>
              <td><strong>{batch.payrollPeriod}</strong></td>
              <td><span className="accounting-approved-payroll__reference">{batch.payrollReference}</span></td>
              <td>{batch.employeeCount}</td>
              <td>{batch.approvedAmount}</td>
              <td><StatusBadge tone={batch.approvalTone}>{batch.approvalStatus}</StatusBadge></td>
              <td><StatusBadge tone={batch.accountingTone}>{batch.accountingStatus}</StatusBadge></td>
              <td>{batch.transferReference}</td>
              <td>{batch.updatedAt}</td>
              <td>
                <button
                  type="button"
                  className="button-link accounting-approved-payroll__details-trigger"
                  onClick={() => onViewDetails(batch)}
                  aria-haspopup="dialog"
                >
                  View details
                  <Icon name="arrow" />
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={9} className="accounting-approved-payroll__empty">
                <strong>No approved payroll records found.</strong>
                <span>Try adjusting your search or filters.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
