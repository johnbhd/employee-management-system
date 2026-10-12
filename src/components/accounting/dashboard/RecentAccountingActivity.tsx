import type { AccountingDashboardActivity } from "@/types/accounting-dashboard";

import { formatCampusDateTime } from "@/lib/campus-time";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type RecentAccountingActivityProps = {
  items: readonly AccountingDashboardActivity[];
};

export function RecentAccountingActivity({ items }: RecentAccountingActivityProps) {
  if (items.length === 0) {
    return (
      <p className="accounting-dashboard__empty-state">
        No Accounting integration activity is available yet.
      </p>
    );
  }

  return (
    <div className="accounting-dashboard__activity-list">
      {items.map((item) => (
        <div className="accounting-dashboard__activity-row" key={item.id}>
          <span className={`accounting-dashboard__activity-icon is-${item.tone}`}>
            <Icon name={item.icon} />
          </span>
          <div>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </div>
          <StatusBadge tone={item.tone}>
            <time dateTime={item.occurredAt}>
              {formatCampusDateTime(new Date(item.occurredAt))}
            </time>
          </StatusBadge>
        </div>
      ))}
    </div>
  );
}
