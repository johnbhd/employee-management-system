import {
  formatAccountingReturnedAmount,
  getAccountingReadinessLabel,
  getAccountingReadinessTone,
  getAccountingTransferLabel,
  getAccountingTransferTone,
} from "@/data/accounting/approved-payroll";
import {
  getPayrollResultStatusLabel,
  getPayrollResultStatusTone,
} from "@/data/payroll/results";
import type { AccountingApprovedPayrollItem } from "@/types/accounting-approved-payroll";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ApprovedPayrollTableProps = {
  records: readonly AccountingApprovedPayrollItem[];
  onViewDetails: (record: AccountingApprovedPayrollItem) => void;
};

function formatEmployeeCount(count: number): string {
  return `${count} ${count === 1 ? "employee" : "employees"}`;
}

export function ApprovedPayrollTable({
  records,
  onViewDetails,
}: ApprovedPayrollTableProps) {
  return (
    <div className="accounting-approved-payroll__table-wrap">
      <table className="data-table accounting-approved-payroll__table">
        <caption className="sr-only">Approved payroll information records</caption>
        <thead>
          <tr>
            <th scope="col">Payroll period</th>
            <th scope="col">Payroll result</th>
            <th scope="col">Payroll reference</th>
            <th scope="col">Employees</th>
            <th scope="col">Returned amount</th>
            <th scope="col">Result status</th>
            <th scope="col">Accounting readiness</th>
            <th scope="col">Transfer status</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {records.length > 0 ? records.map((record) => (
            <tr key={record.payrollResultId}>
              <td>
                <strong>{record.period.label}</strong>
              </td>
              <td>
                <span className="accounting-approved-payroll__reference">
                  {record.payrollResultId}
                </span>
                <small className="accounting-approved-payroll__secondary">
                  Batch {record.references.batchId}
                </small>
              </td>
              <td>
                <span className="accounting-approved-payroll__reference">
                  {record.references.externalPayrollReference ?? "—"}
                </span>
              </td>
              <td>{formatEmployeeCount(record.employeeCount)}</td>
              <td>
                <span aria-label="Returned amount not provided by Payroll result">
                  {formatAccountingReturnedAmount(record.returnedAmount)}
                </span>
              </td>
              <td>
                <StatusBadge tone={getPayrollResultStatusTone(record.payrollResultStatus)}>
                  {getPayrollResultStatusLabel(record.payrollResultStatus)}
                </StatusBadge>
              </td>
              <td>
                <StatusBadge tone={getAccountingReadinessTone(record.accountingReadiness.status)}>
                  {getAccountingReadinessLabel(record.accountingReadiness.status)}
                </StatusBadge>
              </td>
              <td>
                <StatusBadge tone={getAccountingTransferTone(record.accountingTransfer.status)}>
                  {getAccountingTransferLabel(record.accountingTransfer.status)}
                </StatusBadge>
              </td>
              <td>
                <button
                  type="button"
                  className="button-link accounting-approved-payroll__details-trigger"
                  onClick={() => onViewDetails(record)}
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
                <strong>No approved payroll information is available for Accounting.</strong>
                <span>Completed Payroll Results will appear here when they are ready for downstream processing.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
