import type { AccountingTransferView } from "@/types/accounting-transfers";

import { StatusBadge } from "@/components/ui/StatusBadge";

type AccountingAttentionTableProps = {
  items: readonly AccountingTransferView[];
  onView: (item: AccountingTransferView) => void;
};

export function AccountingAttentionTable({ items, onView }: AccountingAttentionTableProps) {
  return (
    <div className="accounting-integration-status__table-wrap">
      <table className="data-table accounting-integration-status__attention-table">
        <caption className="sr-only">Transfers requiring attention</caption>
        <thead>
          <tr>
            <th>Transaction ref.</th>
            <th>Payroll ref.</th>
            <th>Period</th>
            <th>Date / time</th>
            <th>Amount</th>
            <th>Error</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.transferId}>
              <td>{item.transactionReference}</td>
              <td>{item.payrollReference}</td>
              <td>{item.period}</td>
              <td>
                {item.date}
                <small className="accounting-integration-status__muted-cell">{item.time}</small>
              </td>
              <td>{item.amount}</td>
              <td>{item.error ?? "No failure summary recorded"}</td>
              <td><StatusBadge tone={item.tone}>{item.status}</StatusBadge></td>
              <td>
                <div className="accounting-integration-status__row-actions">
                  <button
                    type="button"
                    className="button-link"
                    onClick={() => onView(item)}
                  >
                    View details
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
