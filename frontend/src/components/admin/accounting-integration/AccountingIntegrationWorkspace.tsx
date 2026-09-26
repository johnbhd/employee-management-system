import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  accountingReadinessItems,
  accountingSummaryMetrics,
  accountingValidationChecks,
} from "@/data/accounting-integration";
import type { IconName } from "@/types/ui";

import {
  AccountingExceptionTable,
  AccountingFieldMappingTable,
  AccountingSynchronizationHistoryTable,
  AccountingTransferQueueTable,
} from "./AccountingTransferTable";

const validationIcons: Record<string, IconName> = {
  Passed: "check",
  Warning: "warning",
  Failed: "errors",
};

const accountingHealth = [
  { label: "Integration mode", value: "Prototype / Simulated", tone: "info" as const },
  { label: "Last successful transfer", value: "PAY-2026-09-A", tone: "success" as const },
  { label: "Last acknowledgement", value: "Received · 09:15 AM", tone: "success" as const },
  { label: "Pending transfers", value: "2 batches", tone: "warning" as const },
  { label: "Failed transfers", value: "1 batch", tone: "danger" as const },
];

export function AccountingIntegrationWorkspace() {
  return (
    <div className="admin-page accounting-integration-workspace">
      <AdminPageHeader
        eyebrow="Downstream integration"
        title="Accounting Integration"
        description="Review the preparation and handoff of approved Payroll information to the Existing Accounting System."
        actions={(
          <ActionButton icon="refresh" action="Accounting integration mock data refreshed.">
            Refresh integration
          </ActionButton>
        )}
      />

      <section className="metric-grid accounting-integration-summary" aria-label="Accounting transfer summary">
        {accountingSummaryMetrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span className={`metric-icon metric-icon-${metric.tone}`} aria-hidden="true">
              <Icon name={metric.icon} />
            </span>
            <div className="metric-content">
              <p className="metric-label">{metric.label}</p>
              <p className="metric-value">{metric.value}</p>
              <p className="metric-note">{metric.note}</p>
            </div>
          </article>
        ))}
      </section>

      <SectionCard title="Accounting data flow" eyebrow="Approved Payroll information to acknowledgement">
        <FlowDiagram
          className="accounting-integration-flow"
          nodes={[
            {
              label: "Approved Payroll",
              detail: "Eligible source",
              icon: "payroll",
              status: "Ready",
              tone: "success",
            },
            {
              label: "Integration layer",
              detail: "Prepare + validate",
              icon: "shield",
              status: "Processing",
              tone: "info",
            },
            {
              label: "Accounting payload",
              detail: "Mapped structure",
              icon: "file",
              status: "Prepared",
              tone: "info",
            },
            {
              label: "Transfer batch",
              detail: "Prototype handoff",
              icon: "arrow",
              status: "Tracked",
              tone: "warning",
            },
            {
              label: "Existing Accounting",
              detail: "External system",
              icon: "accounting",
              status: "External",
              tone: "muted",
            },
            {
              label: "Acknowledgement",
              detail: "Transfer result",
              icon: "check",
              status: "Recorded",
              tone: "success",
            },
          ]}
        />
        <p className="data-flow-note accounting-flow-note">
          The Admin Dashboard flow pattern is reused here: each stage is visible, status-labeled, and connected by a
          shared sequence. Payroll and Accounting remain responsible for their own systems.
        </p>
      </SectionCard>

      <SectionCard title="System ownership" eyebrow="Integration boundary">
        <div className="panel-body accounting-ownership-grid">
          <div className="accounting-ownership-node">
            <span className="accounting-ownership-icon">
              <Icon name="payroll" />
            </span>
            <span className="accounting-ownership-label">Upstream system</span>
            <strong>Existing Payroll System</strong>
            <StatusBadge tone="muted">External</StatusBadge>
          </div>
          <span className="accounting-ownership-arrow" aria-hidden="true">
            <Icon name="arrow" />
          </span>
          <div className="accounting-ownership-node accounting-ownership-node-active">
            <span className="accounting-ownership-icon">
              <Icon name="accounting" />
            </span>
            <span className="accounting-ownership-label">Monitored layer</span>
            <strong>Accounting Integration</strong>
            <StatusBadge tone="info">Prototype</StatusBadge>
          </div>
          <span className="accounting-ownership-arrow" aria-hidden="true">
            <Icon name="arrow" />
          </span>
          <div className="accounting-ownership-node">
            <span className="accounting-ownership-icon">
              <Icon name="building" />
            </span>
            <span className="accounting-ownership-label">Downstream system</span>
            <strong>Existing Accounting System</strong>
            <StatusBadge tone="muted">External</StatusBadge>
          </div>
        </div>
      </SectionCard>

      <div className="accounting-integration-overview">
        <SectionCard title="Accounting readiness" eyebrow="Transfer gate">
          <div className="panel-body">
            <ProgressList items={accountingReadinessItems} />
          </div>
        </SectionCard>

        <SectionCard title="Payload validation" eyebrow="Pre-transfer checks">
          <div className="panel-body accounting-validation-list">
            {accountingValidationChecks.map((check) => (
              <div className="accounting-validation-row" key={check.label}>
                <span className={`accounting-validation-icon status-${check.tone}`} aria-hidden="true">
                  <Icon name={validationIcons[check.status]} />
                </span>
                <span className="accounting-validation-copy">
                  <strong>{check.label}</strong>
                  <small>{check.detail}</small>
                </span>
                <StatusBadge tone={check.tone}>{check.status}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Transfer queue"
        eyebrow="Approved Payroll information"
        actions={<StatusBadge tone="info">Prototype data</StatusBadge>}
      >
        <AccountingTransferQueueTable />
      </SectionCard>

      <div className="accounting-integration-secondary">
        <SectionCard title="Field mapping" eyebrow="Prototype contract">
          <AccountingFieldMappingTable />
          <p className="data-flow-note accounting-table-note">
            Field names are illustrative. The production Accounting contract and ownership rules remain to be
            confirmed.
          </p>
        </SectionCard>

        <SectionCard title="Transfer health" eyebrow="Current prototype status">
          <div className="panel-body accounting-health-list">
            {accountingHealth.map((item) => (
              <div className="accounting-health-row" key={item.label}>
                <span>{item.label}</span>
                <StatusBadge tone={item.tone}>{item.value}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Blocked and failed transfers" eyebrow="Items requiring review">
        <AccountingExceptionTable />
      </SectionCard>

      <SectionCard title="Synchronization history" eyebrow="Transfer traceability">
        <AccountingSynchronizationHistoryTable />
      </SectionCard>

      <SectionCard title="Audit visibility" eyebrow="Future traceability">
        <div className="panel-body accounting-audit-panel">
          <div className="accounting-audit-copy">
            <span className="accounting-audit-icon" aria-hidden="true">
              <Icon name="audit" />
            </span>
            <div>
              <strong>Accounting transfer actions should be auditable.</strong>
              <p>
                Future records should retain transfer ID, Payroll batch ID, prepared by, prepared at, acknowledgement
                time, retry count, and transfer result.
              </p>
            </div>
          </div>
          <StatusBadge tone="muted">Audit log integration · To Be Confirmed</StatusBadge>
        </div>
      </SectionCard>

      <section className="accounting-integration-boundary">
        <Icon name="shield" />
        <div>
          <p className="section-kicker">Integration boundary</p>
          <h2>Approved Payroll information is the only downstream source shown here.</h2>
          <p>
            Payroll computation remains the responsibility of the Existing Payroll System. Journal entries, ledger
            posting, financial reconciliation, and Accounting reports remain the responsibility of the Existing
            Accounting System.
          </p>
        </div>
      </section>
    </div>
  );
}
