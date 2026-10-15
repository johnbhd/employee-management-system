import type { AccountingTransferView } from "@/types/accounting-transfers";

import { StatusBadge } from "@/components/ui/StatusBadge";

type AccountingSynchronizationTableProps = {
  items: readonly AccountingTransferView[];
  onView: (item: AccountingTransferView) => void;
};

export function AccountingSynchronizationTable({ items, onView }: AccountingSynchronizationTableProps) {
  return (
    <div className="accounting-integration-status__table-wrap">
      <table className="data-table accounting-integration-status__history-table">
        <caption className="sr-only">Accounting synchronization history</caption>
        <thead>
          <tr>
            <th>Date / time</th>
            <th>Transaction ref.</th>
            <th>Payroll ref.</th>
            <th>Records</th>
            <th>Amount</th>
            <th>Result</th>
            <th>Acknowledgment</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.transferId}>
              <td>{item.date} <small className="accounting-integration-status__muted-cell">{item.time}</small></td>
              <td>{item.transactionReference}</td>
              <td>{item.payrollReference}</td>
              <td>{item.records}</td>
              <td>{item.amount}</td>
              <td><StatusBadge tone={item.resultTone}>{item.result}</StatusBadge></td>
              <td>{item.acknowledgement}</td>
              <td>
                <button type="button" className="button-link" onClick={() => onView(item)}>
                  View details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
