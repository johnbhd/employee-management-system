import type { AccountingActivityItem } from "@/data/accounting/dashboard";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type RecentAccountingActivityProps = {
  items: readonly AccountingActivityItem[];
};

export function RecentAccountingActivity({ items }: RecentAccountingActivityProps) {
  return (
    <div className="accounting-dashboard__activity-list">
      {items.map((item) => (
        <div className="accounting-dashboard__activity-row" key={`${item.time}-${item.event}`}>
          <span className={`accounting-dashboard__activity-icon is-${item.tone}`}>
            <Icon name={item.icon} />
          </span>
          <div>
            <strong>{item.event}</strong>
            <p>{item.detail}</p>
          </div>
          <StatusBadge tone={item.tone}>{item.time}</StatusBadge>
        </div>
      ))}
    </div>
  );
}
