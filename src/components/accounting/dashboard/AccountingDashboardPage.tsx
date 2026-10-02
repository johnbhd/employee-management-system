import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  accountingActivities,
  accountingHealth,
  accountingPayrollBatches,
  accountingSummaryMetrics,
  latestApprovedPayroll,
} from "@/data/accounting/dashboard";

import { AccountingIntegrationFlow } from "./AccountingIntegrationFlow";
import { IntegrationHealth } from "./IntegrationHealth";
import { LatestApprovedPayroll } from "./LatestApprovedPayroll";
import { RecentAccountingActivity } from "./RecentAccountingActivity";
import { RecentPayrollBatches } from "./RecentPayrollBatches";

export function AccountingDashboardPage() {
  return (
    <div className="accounting-dashboard">
      <AdminPageHeader
        eyebrow="Accounting integration"
        title="Accounting Dashboard"
        description="Review approved payroll information and monitor transfers to the Existing Accounting System."
        actions={(
          <ActionButton icon="refresh" action="Accounting dashboard data refreshed.">
            Refresh data
          </ActionButton>
        )}
      />

      <div className="metric-grid accounting-dashboard__summary">
        {accountingSummaryMetrics.map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </div>

      <SectionCard
        title="Latest Approved Payroll"
        eyebrow="Incoming from Existing Payroll System"
        className="accounting-dashboard__latest-card"
      >
        <LatestApprovedPayroll payroll={latestApprovedPayroll} />
      </SectionCard>

      <SectionCard
        title="Accounting Integration Flow"
        eyebrow="Approved payroll to downstream handoff"
        className="accounting-dashboard__flow-card"
      >
        <AccountingIntegrationFlow />
      </SectionCard>

      <div className="accounting-dashboard__split">
        <SectionCard
          title="Recent Payroll Batches"
          eyebrow="Approved payroll information"
          className="accounting-dashboard__batches-card"
        >
          <RecentPayrollBatches batches={accountingPayrollBatches} />
        </SectionCard>

        <SectionCard
          title="Integration Health"
          eyebrow="Current boundary status"
          className="accounting-dashboard__health-card"
        >
          <div className="accounting-dashboard__health-copy">
            <Icon name="info" />
            <p>Statuses are simulated until the Existing Payroll System and Existing Accounting System are connected.</p>
          </div>
          <IntegrationHealth items={accountingHealth} />
        </SectionCard>
      </div>

      <SectionCard
        title="Recent Accounting Activity"
        eyebrow="Latest integration events"
        className="accounting-dashboard__activity-card"
      >
        <RecentAccountingActivity items={accountingActivities} />
      </SectionCard>

      <p className="accounting-dashboard__boundary-note">
        <Icon name="shield" />
        This workspace displays deterministic integration information only. It does not calculate payroll, post journal entries, or write to the Existing Accounting System.
      </p>
    </div>
  );
}
