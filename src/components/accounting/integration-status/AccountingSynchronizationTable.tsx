import type { AccountingSynchronizationRecord } from "@/data/accounting/integration-status";

import { StatusBadge } from "@/components/ui/StatusBadge";

type AccountingSynchronizationTableProps = {
  items: readonly AccountingSynchronizationRecord[];
};

export function AccountingSynchronizationTable({ items }: AccountingSynchronizationTableProps) {
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
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.transactionReference}>
              <td>{item.dateTime}</td>
              <td>{item.transactionReference}</td>
              <td>{item.payrollReference}</td>
              <td>{item.records}</td>
              <td>{item.amount}</td>
              <td><StatusBadge tone={item.resultTone}>{item.result}</StatusBadge></td>
              <td>{item.acknowledgment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
