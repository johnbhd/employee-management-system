import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PayrollAlert } from "@/types/payroll-dashboard";

export function PayrollHandoffAlerts({ alerts }: { alerts: readonly PayrollAlert[] }) {
  return (
    <div className="payroll-dashboard__alerts" aria-label="Payroll handoff alerts">
      {alerts.length > 0 ? alerts.map((alert) => (
          <div className="payroll-dashboard__alert" key={alert.id}>
            <span className={`payroll-dashboard__alert-icon is-${alert.tone}`} aria-hidden="true">
              <Icon name={alert.icon} />
            </span>
            <p>{alert.message}</p>
            <StatusBadge tone={alert.tone}>{alert.status}</StatusBadge>
          </div>
      )) : (
        <div className="payroll-dashboard__empty-alert">
          <Icon name="check" />
          <p>No payroll handoff alerts for the current period.</p>
        </div>
      )}
    </div>
  );
}
