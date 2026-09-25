import type { HrPendingAction } from "@/data/hr";

import { Icon } from "@/components/ui/Icon";

type HrPendingActionsProps = {
  actions: readonly HrPendingAction[];
};

export function HrPendingActions({ actions }: HrPendingActionsProps) {
  return (
    <section className="hr-dashboard-panel hr-pending-panel" aria-labelledby="hr-pending-actions-heading">
      <div className="hr-panel-header">
        <div>
          <p className="hr-section-kicker">Working queue</p>
          <h2 id="hr-pending-actions-heading">Pending HR Actions</h2>
        </div>
      </div>
      {actions.length > 0 ? (
        <div className="hr-action-list">
          {actions.map((action) => (
            <div className="hr-action-row" key={action.label}>
              <span className={`hr-action-icon hr-action-icon-${action.tone}`} aria-hidden="true">
                <Icon name={action.icon} />
              </span>
              <div className="hr-action-copy">
                <strong>{action.label}</strong>
                <span>{action.note}</span>
              </div>
              <strong className="hr-action-count">{action.count}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="hr-empty-state">No pending HR actions.</p>
      )}
    </section>
  );
}
