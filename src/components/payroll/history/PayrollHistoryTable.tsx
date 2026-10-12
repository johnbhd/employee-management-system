import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatPayrollHistoryDate,
  getPayrollHistoryAcknowledgementLabel,
  getPayrollHistoryResultStatusLabel,
  getPayrollHistoryTone,
  getPayrollHistoryTransferStatusLabel,
  type PayrollHistoryRecord,
} from "@/data/payroll/history";

type PayrollHistoryTableProps = {
  records: readonly PayrollHistoryRecord[];
  onViewDetails: (record: PayrollHistoryRecord) => void;
};

export function PayrollHistoryTable({ records, onViewDetails }: PayrollHistoryTableProps) {
  return (
    <div className="payroll-history__table-wrap">
      <table className="data-table payroll-history__table">
        <caption className="sr-only">Historical payroll operations</caption>
        <thead>
          <tr>
            <th scope="col">Batch ID</th>
            <th scope="col">Payroll period</th>
            <th scope="col">Employees</th>
            <th scope="col">Created by</th>
            <th scope="col">Created at</th>
            <th scope="col">Transfer status</th>
            <th scope="col">Payroll acknowledgement</th>
            <th scope="col">Result status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length > 0 ? records.map((record) => {
            const transferStatus = getPayrollHistoryTransferStatusLabel(record.handoff.status);
            const acknowledgement = getPayrollHistoryAcknowledgementLabel(record.handoff.acknowledgementStatus);
            const resultStatus = getPayrollHistoryResultStatusLabel(record.result.status);

            return (
              <tr key={record.batchId}>
                <td><strong className="payroll-history__batch-id">{record.batchId}</strong></td>
                <td>{record.period.label}</td>
                <td>{record.employeeCount}</td>
                <td>{record.createdBy.displayName}</td>
                <td>{formatPayrollHistoryDate(record.createdAt)}</td>
                <td><StatusBadge tone={getPayrollHistoryTone(transferStatus)}>{transferStatus}</StatusBadge></td>
                <td><StatusBadge tone={getPayrollHistoryTone(acknowledgement)}>{acknowledgement}</StatusBadge></td>
                <td><StatusBadge tone={getPayrollHistoryTone(resultStatus)}>{resultStatus}</StatusBadge></td>
                <td>
                  <div className="payroll-history__row-actions">
                    <button type="button" className="button-link" onClick={() => onViewDetails(record)}>View details</button>
                    <details className="payroll-history__row-menu">
                      <summary aria-label={`More actions for ${record.batchId}`}><Icon name="menu" /></summary>
                      <div>
                        <button type="button" onClick={() => onViewDetails(record)}>View details</button>
                      </div>
                    </details>
                  </div>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={9} className="payroll-history__empty">
                <strong>No historical payroll records match your filters.</strong>
                <span>Clear a filter or search term to return to the available history.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
