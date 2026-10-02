import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  accountingAttentionTransfers,
  accountingConnectionStatuses,
  accountingIntegrationMetrics,
  accountingSynchronizationHistory,
} from "@/data/accounting/integration-status";

import { AccountingAttentionTable } from "./AccountingAttentionTable";
import { AccountingConnectionTable } from "./AccountingConnectionTable";
import { AccountingIntegrationStatusFlow } from "./AccountingIntegrationStatusFlow";
import { AccountingSynchronizationTable } from "./AccountingSynchronizationTable";

export function AccountingIntegrationStatusPage() {
  return (
    <div className="accounting-integration-status">
      <AdminPageHeader
        eyebrow="System integration"
        title="Accounting Integration Status"
        description="Monitor synchronization between approved payroll information and the Existing Accounting System."
        actions={(
          <ActionButton icon="refresh" action="Accounting integration status refreshed.">
            Refresh data
          </ActionButton>
        )}
      />

      <div className="metric-grid accounting-integration-status__metrics">
        {accountingIntegrationMetrics.map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </div>

      <SectionCard
        title="Integration Flow"
        eyebrow="Approved payroll to accounting system"
        className="accounting-integration-status__flow-card"
      >
        <AccountingIntegrationStatusFlow />
      </SectionCard>

      <div className="accounting-integration-status__split">
        <SectionCard
          title="System Connection Status"
          eyebrow="Current boundary status"
          className="accounting-integration-status__connection-card"
        >
          <AccountingConnectionTable items={accountingConnectionStatuses} />
        </SectionCard>

        <SectionCard
          title="Transfers Requiring Attention"
          eyebrow="Review before retrying"
          className="accounting-integration-status__attention-card"
        >
          <AccountingAttentionTable items={accountingAttentionTransfers} />
        </SectionCard>
      </div>

      <SectionCard
        title="Synchronization History"
        eyebrow="Recent transfer records"
        className="accounting-integration-status__history-card"
      >
        <AccountingSynchronizationTable items={accountingSynchronizationHistory} />
      </SectionCard>

      <p className="accounting-integration-status__boundary-note">
        <Icon name="shield" />
        <span>
          <StatusBadge tone="warning">Simulated status</StatusBadge>
          This page displays deterministic integration history only. Retry controls provide local interface feedback and do not contact external systems.
        </span>
      </p>
    </div>
  );
}
