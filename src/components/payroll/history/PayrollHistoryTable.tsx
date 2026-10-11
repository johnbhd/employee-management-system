import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getPayrollHistoryTone, type PayrollHistoryRecord } from "@/data/payroll/history";

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
          {records.length > 0 ? records.map((record) => (
            <tr key={record.id}>
              <td><strong className="payroll-history__batch-id">{record.id}</strong></td>
              <td>{record.period}</td>
              <td>{record.employees}</td>
              <td>{record.createdBy}</td>
              <td>{record.createdAt}</td>
              <td><StatusBadge tone={getPayrollHistoryTone(record.transferStatus)}>{record.transferStatus}</StatusBadge></td>
              <td><StatusBadge tone={getPayrollHistoryTone(record.acknowledgement)}>{record.acknowledgement}</StatusBadge></td>
              <td><StatusBadge tone={getPayrollHistoryTone(record.resultStatus)}>{record.resultStatus}</StatusBadge></td>
              <td>
                <div className="payroll-history__row-actions">
                  <button type="button" className="button-link" onClick={() => onViewDetails(record)}>View details</button>
                  <details className="payroll-history__row-menu">
                    <summary aria-label={`More actions for ${record.id}`}><Icon name="menu" /></summary>
                    <div>
                      <button type="button" onClick={() => onViewDetails(record)}>View details</button>
                    </div>
                  </details>
                </div>
              </td>
            </tr>
          )) : (
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
