import type { IconName, StatusTone } from "@/types/ui";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type AccountingFlowNode = {
  label: string;
  detail: string;
  icon: IconName;
  status: string;
  tone: StatusTone;
};

const accountingFlowNodes: AccountingFlowNode[] = [
  {
    label: "Existing Payroll System",
    detail: "Approved payroll source",
    icon: "payroll",
    status: "Source",
    tone: "info",
  },
  {
    label: "Approved Payroll Information",
    detail: "Validated batches",
    icon: "file",
    status: "Ready",
    tone: "success",
  },
  {
    label: "Accounting Integration",
    detail: "Transfer validation",
    icon: "accounting",
    status: "Simulated",
    tone: "warning",
  },
  {
    label: "Existing Accounting System",
    detail: "External destination",
    icon: "building",
    status: "External",
    tone: "muted",
  },
];

export function AccountingIntegrationFlow() {
  return (
    <div className="accounting-dashboard__flow" aria-label="Accounting integration flow">
      {accountingFlowNodes.map((node, index) => (
        <div className="accounting-dashboard__flow-segment" key={node.label}>
          <div className="accounting-dashboard__flow-node">
            <span className="accounting-dashboard__flow-icon">
              <Icon name={node.icon} />
            </span>
            <strong>{node.label}</strong>
            <small>{node.detail}</small>
            <StatusBadge tone={node.tone}>{node.status}</StatusBadge>
          </div>
          {index < accountingFlowNodes.length - 1 ? (
            <span className="accounting-dashboard__flow-arrow" aria-hidden="true">
              <Icon name="arrow" />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
