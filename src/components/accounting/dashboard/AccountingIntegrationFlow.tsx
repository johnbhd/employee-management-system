import type {
  AccountingIntegrationFlowState,
  AccountingIntegrationFlowStep,
} from "@/types/accounting-dashboard";
import type { IconName, StatusTone } from "@/types/ui";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCampusDateTime } from "@/lib/campus-time";

type AccountingIntegrationFlowProps = {
  flow: readonly AccountingIntegrationFlowStep[];
};

const flowIcons: Record<AccountingIntegrationFlowStep["key"], IconName> = {
  "payroll-result": "payroll",
  "accounting-ready": "file",
  submitted: "accounting",
  acknowledged: "check",
};

const stateLabels: Record<AccountingIntegrationFlowState, string> = {
  complete: "Complete",
  current: "Current",
  pending: "Pending",
  failed: "Needs attention",
};

const stateTones: Record<AccountingIntegrationFlowState, StatusTone> = {
  complete: "success",
  current: "warning",
  pending: "muted",
  failed: "danger",
};

export function AccountingIntegrationFlow({ flow }: AccountingIntegrationFlowProps) {
  if (flow.length === 0) {
    return (
      <p className="accounting-dashboard__empty-state">
        No Payroll Result is available to show in the Accounting integration flow.
      </p>
    );
  }

  return (
    <div className="accounting-dashboard__flow" aria-label="Accounting integration flow">
      {flow.map((step, index) => (
        <div className="accounting-dashboard__flow-segment" key={step.key}>
          <div className={`accounting-dashboard__flow-node is-${step.state}`}>
            <span className="accounting-dashboard__flow-icon">
              <Icon name={flowIcons[step.key]} />
            </span>
            <strong>{step.label}</strong>
            <small>{step.detail}</small>
            <StatusBadge tone={stateTones[step.state]}>
              {stateLabels[step.state]}
            </StatusBadge>
            {step.occurredAt ? (
              <time dateTime={step.occurredAt}>{formatCampusDateTime(new Date(step.occurredAt))}</time>
            ) : null}
          </div>
          {index < flow.length - 1 ? (
            <span className="accounting-dashboard__flow-arrow" aria-hidden="true">
              <Icon name="arrow" />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
