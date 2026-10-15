import type { AccountingDashboardHealthItem } from "@/types/accounting-dashboard";

import { formatCampusDateTime } from "@/lib/campus-time";
import { StatusBadge } from "@/components/ui/StatusBadge";

type IntegrationHealthProps = {
  items: readonly AccountingDashboardHealthItem[];
};

export function IntegrationHealth({ items }: IntegrationHealthProps) {
  if (items.length === 0) {
    return (
      <p className="accounting-dashboard__empty-state">
        Integration health is unavailable until the dashboard data loads.
      </p>
    );
  }

  return (
    <div className="accounting-dashboard__health-list">
      {items.map((item) => (
        <div className="accounting-dashboard__health-row" key={item.name}>
          <div>
            <strong>{item.name}</strong>
            <p>{item.detail}</p>
            <small>
              {item.lastEventAt
                ? `Last event · ${formatCampusDateTime(new Date(item.lastEventAt))}`
                : "No event recorded"}
            </small>
          </div>
          <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
        </div>
      ))}
    </div>
  );
}
