import type { AccountingHealthItem } from "@/data/accounting/dashboard";

import { StatusBadge } from "@/components/ui/StatusBadge";

type IntegrationHealthProps = {
  items: readonly AccountingHealthItem[];
};

export function IntegrationHealth({ items }: IntegrationHealthProps) {
  return (
    <div className="accounting-dashboard__health-list">
      {items.map((item) => (
        <div className="accounting-dashboard__health-row" key={item.name}>
          <div>
            <strong>{item.name}</strong>
            <p>{item.detail}</p>
            <small>{item.lastChecked}</small>
          </div>
          <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
        </div>
      ))}
    </div>
  );
}
