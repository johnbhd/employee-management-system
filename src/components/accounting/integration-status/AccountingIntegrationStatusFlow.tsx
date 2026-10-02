import { accountingIntegrationFlow } from "@/data/accounting/integration-status";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function AccountingIntegrationStatusFlow() {
  return (
    <div className="accounting-integration-status__flow" aria-label="Accounting integration flow">
      {accountingIntegrationFlow.map((step, index) => (
        <div className="accounting-integration-status__flow-segment" key={step.label}>
          <div className={`accounting-integration-status__flow-step ${step.highlighted ? "is-highlighted" : ""}`}>
            <span className={`accounting-integration-status__flow-icon is-${step.tone}`}>
              <Icon name={step.icon} />
            </span>
            <strong>{step.label}</strong>
            <span>{step.detail}</span>
            {step.highlighted ? <StatusBadge tone="info">Validation gate</StatusBadge> : null}
          </div>
          {index < accountingIntegrationFlow.length - 1 ? (
            <span className="accounting-integration-status__flow-arrow" aria-hidden="true">
              <Icon name="arrow" />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
