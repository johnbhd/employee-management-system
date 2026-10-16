import { getAccountingReadinessTone } from "@/data/accounting/approved-payroll";
import type { AccountingApprovedPayrollItem } from "@/types/accounting-approved-payroll";

import { StatusBadge } from "@/components/ui/StatusBadge";

type AccountingReadyPayrollTableProps = {
  items: readonly AccountingApprovedPayrollItem[];
  preparingResultId: string | null;
  onPrepare: (record: AccountingApprovedPayrollItem) => void;
};

export function AccountingReadyPayrollTable({
  items,
  preparingResultId,
  onPrepare,
}: AccountingReadyPayrollTableProps) {
  return (
    <div className="accounting-integration-status__table-wrap">
      <table className="data-table accounting-integration-status__ready-table">
        <caption className="sr-only">Payroll results ready for Accounting transfer</caption>
        <thead>
          <tr>
            <th scope="col">Payroll result</th>
            <th scope="col">Period</th>
            <th scope="col">Payroll reference</th>
            <th scope="col">Employees</th>
            <th scope="col">Readiness</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? items.map((record) => {
            const isPreparing = preparingResultId === record.payrollResultId;
            return (
              <tr key={record.payrollResultId}>
                <td>
                  <strong>{record.payrollResultId}</strong>
                  <small className="accounting-integration-status__muted-cell">
                    Batch {record.references.batchId}
                  </small>
                </td>
                <td>{record.period.label}</td>
                <td>{record.references.externalPayrollReference}</td>
                <td>{record.employeeCount}</td>
                <td>
                  <StatusBadge tone={getAccountingReadinessTone(record.accountingReadiness.status)}>
                    Ready for transfer
                  </StatusBadge>
                </td>
                <td>
                  <div className="accounting-integration-status__row-actions">
                    <button
                      type="button"
                      className="button-primary accounting-integration-status__row-button"
                      onClick={() => onPrepare(record)}
                      disabled={isPreparing}
                    >
                      {isPreparing ? "Preparing..." : "Prepare transfer"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={6} className="accounting-integration-status__empty">
                <strong>No Payroll Results are ready for Accounting transfer.</strong>
                <span>Completed Payroll Results with a trusted external reference will appear here.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
