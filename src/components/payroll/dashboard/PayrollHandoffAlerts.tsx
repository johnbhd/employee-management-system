import type { PayrollAlert } from "@/data/payroll/dashboard";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function PayrollHandoffAlerts({ alerts }: { alerts: readonly PayrollAlert[] }) {
  return (
    <div className="payroll-dashboard__alerts" aria-label="Payroll handoff alerts">
      {alerts.map((alert) => (
        <div className="payroll-dashboard__alert" key={alert.message}>
          <span className={`payroll-dashboard__alert-icon is-${alert.tone}`} aria-hidden="true">
            <Icon name={alert.icon} />
          </span>
          <p>{alert.message}</p>
          <StatusBadge tone={alert.tone}>{alert.status}</StatusBadge>
        </div>
      ))}
    </div>
  );
}
