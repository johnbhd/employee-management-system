import type { AccountingAttentionTransfer } from "@/data/accounting/integration-status";

import { ActionButton } from "@/components/ui/ActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";

type AccountingAttentionTableProps = {
  items: readonly AccountingAttentionTransfer[];
};

export function AccountingAttentionTable({ items }: AccountingAttentionTableProps) {
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
            <tr key={item.transactionReference}>
              <td>{item.transactionReference}</td>
              <td>{item.payrollReference}</td>
              <td>{item.period}</td>
              <td>
                {item.date}
                <small className="accounting-integration-status__muted-cell">{item.time}</small>
              </td>
              <td>{item.amount}</td>
              <td>{item.error}</td>
              <td><StatusBadge tone={item.tone}>{item.status}</StatusBadge></td>
              <td>
                <div className="accounting-integration-status__row-actions">
                  <ActionButton
                    className="accounting-integration-status__row-action"
                    variant="link"
                    icon="warning"
                    action={`${item.transactionReference} error details opened.`}
                  >
                    View error
                  </ActionButton>
                  <ActionButton
                    className="accounting-integration-status__row-action"
                    variant="secondary"
                    icon="refresh"
                    action={`${item.transactionReference} retry queued locally.`}
                  >
                    Retry
                  </ActionButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
