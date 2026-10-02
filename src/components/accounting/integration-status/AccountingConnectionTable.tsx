import type { AccountingConnectionStatus } from "@/data/accounting/integration-status";

import { StatusBadge } from "@/components/ui/StatusBadge";

type AccountingConnectionTableProps = {
  items: readonly AccountingConnectionStatus[];
};

export function AccountingConnectionTable({ items }: AccountingConnectionTableProps) {
  return (
    <div className="accounting-integration-status__table-wrap">
      <table className="data-table accounting-integration-status__table">
        <caption className="sr-only">Accounting system connection status</caption>
        <thead>
          <tr>
            <th>System</th>
            <th>Status</th>
            <th>Last sync</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.system}>
              <td>{item.system}</td>
              <td><StatusBadge tone={item.tone}>{item.status}</StatusBadge></td>
              <td>{item.lastSync}</td>
              <td>{item.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
