import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import type { IconName, Metric } from "@/types/ui";

import {
  accountingFieldMappings,
  accountingReadinessItems,
  accountingValidationChecks,
} from "@/data/accounting";

import {
  AccountingFieldMappingTable,
  AccountingSynchronizationHistoryTable,
  AccountingTransferBatchTable,
  AccountingTransferCandidatesTable,
  BlockedAccountingTransfersTable,
  FailedAccountingTransfersTable,
} from "./AccountingIntegrationTables";

const accountingSummaryMetrics: readonly Metric[] = [
  {
    label: "Accounting-ready batches",
    value: "4",
    note: "Approved Payroll information",
    icon: "check",
    tone: "success",
  },
  {
    label: "Pending Payroll approval",
    value: "2",
    note: "Held from downstream transfer",
    icon: "clock",
    tone: "warning",
  },
  {
    label: "Successful transfers",
    value: "3",
    note: "Prototype acknowledgements",
    icon: "arrow",
    tone: "info",
  },
  {
    label: "Failed transfers",
    value: "1",
    note: "Retry attention needed",
    icon: "warning",
    tone: "danger",
  },
];

const validationIcons: Record<string, IconName> = {
  Passed: "check",
  Warning: "warning",
  Failed: "errors",
};

const accountingHealthMetrics = [
  {
    label: "Accounting integration",
    value: "Prototype / Simulated",
    tone: "info" as const,
  },
  {
    label: "Last successful transfer",
    value: "ACC-2026-09-001",
    tone: "success" as const,
  },
  {
    label: "Last acknowledgement",
    value: "Received · 09:15 AM",
    tone: "success" as const,
  },
  {
    label: "Pending transfers",
    value: "1 batch",
    tone: "warning" as const,
  },
  {
    label: "Failed transfers",
    value: "1 batch",
    tone: "danger" as const,
  },
];

export function AccountingIntegrationPage() {
  return (
    <div className="admin-page accounting-page">
      <AdminPageHeader
        eyebrow="Downstream integration"
        title="Accounting Integration"
        description={
          "Monitor the preparation and transfer of approved Payroll information to the Existing Accounting System."
        }
        actions={
          <ActionButton icon="refresh" action="Accounting integration mock data refreshed.">
            Refresh integration
          </ActionButton>
        }
      />

      <section className="notice accounting-notice">
        <Icon name="info" />
        <p>
          <strong>Prototype / Simulated integration.</strong> This page monitors approved Payroll information only;
          it does not contact a live Accounting API, post journal entries, or calculate financial values.
        </p>
      </section>

      <div className="metric-grid accounting-metrics">
        {accountingSummaryMetrics.map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </div>

      <SectionCard title="System relationship" eyebrow="External system ownership">
        <div className="panel-body">
          <div className="accounting-relationship-grid" aria-label="Payroll to Accounting system relationship">
            <div className="accounting-relationship-node">
              <span className="accounting-relationship-icon">
                <Icon name="payroll" />
              </span>
              <span className="accounting-relationship-label">Upstream system</span>
              <strong>Existing Payroll System</strong>
              <StatusBadge tone="muted">External</StatusBadge>
            </div>
            <span className="accounting-relationship-arrow" aria-hidden="true">
              <Icon name="arrow" />
            </span>
            <div className="accounting-relationship-node accounting-relationship-node-active">
              <span className="accounting-relationship-icon">
                <Icon name="accounting" />
              </span>
              <span className="accounting-relationship-label">Integration layer</span>
              <strong>Accounting Integration</strong>
              <StatusBadge tone="info">Prototype</StatusBadge>
            </div>
            <span className="accounting-relationship-arrow" aria-hidden="true">
              <Icon name="arrow" />
            </span>
            <div className="accounting-relationship-node">
              <span className="accounting-relationship-icon">
                <Icon name="building" />
              </span>
              <span className="accounting-relationship-label">Downstream system</span>
              <strong>Existing Accounting System</strong>
              <StatusBadge tone="muted">External</StatusBadge>
            </div>
          </div>
          <p className="data-flow-note accounting-relationship-note">
            Raw attendance does not flow directly to Accounting. Approved Payroll information is the conceptual
            upstream source for this downstream integration.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Accounting integration flow" eyebrow="Approved Payroll information to acknowledgement">
        <FlowDiagram
          className="accounting-flow"
          nodes={[
            {
              label: "Verified Attendance",
              detail: "Upstream source",
              icon: "unified",
              status: "Processed upstream",
              tone: "muted",
            },
            {
              label: "Existing Payroll",
              detail: "External system",
              icon: "payroll",
              status: "External",
              tone: "muted",
            },
            {
              label: "Approved Payroll",
              detail: "Downstream source",
              icon: "check",
              status: "Eligible",
              tone: "success",
            },
            {
              label: "Accounting Payload",
              detail: "Integration structure",
              icon: "file",
              status: "Prepared",
              tone: "info",
            },
            {
              label: "Validation",
              detail: "Technical checks",
              icon: "shield",
              status: "Checked",
              tone: "success",
            },
            {
              label: "Transfer Batch",
              detail: "Prototype handoff",
              icon: "arrow",
              status: "Tracked",
              tone: "info",
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
              tone: "info",
            },
          ]}
        />
        <p className="data-flow-note">
          The application monitors the handoff between external systems. Payroll remains responsible for Payroll, and
          Accounting remains responsible for Accounting.
        </p>
      </SectionCard>

      <div className="two-column accounting-overview-grid">
        <SectionCard title="Accounting readiness overview" eyebrow="Downstream transfer gate">
          <div className="panel-body">
            <ProgressList items={accountingReadinessItems} />
          </div>
        </SectionCard>

        <SectionCard title="Payload validation" eyebrow="Technical integration checks">
          <div className="panel-body accounting-validation-list">
            {accountingValidationChecks.map((check) => (
              <div className="accounting-validation-item" key={check.label}>
                <span className={`accounting-validation-icon status-${check.tone}`}>
                  <Icon name={validationIcons[check.status]} />
                </span>
                <span className="accounting-validation-copy">
                  <strong>{check.label}</strong>
                  <small>{check.detail}</small>
                </span>
                <StatusBadge tone={check.tone}>{check.status}</StatusBadge>
              </div>
            ))}
            <div className="accounting-safeguard">
              <span className="accounting-safeguard-icon">
                <Icon name="shield" />
              </span>
              <span>
                <strong>Duplicate transfer protection</strong>
                <small>Previously acknowledged Payroll batches are checked before a new transfer is prepared.</small>
              </span>
              <StatusBadge tone="success">Active · Prototype</StatusBadge>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Payroll → Accounting transfer candidates"
        eyebrow="Approved Payroll information"
        actions={<StatusBadge tone="info">Sample data</StatusBadge>}
      >
        <AccountingTransferCandidatesTable />
      </SectionCard>

      <SectionCard title="Payroll → Accounting field mapping" eyebrow="Prototype mapping">
        <AccountingFieldMappingTable mappings={accountingFieldMappings} />
        <p className="data-flow-note">
          Field names are illustrative integration examples. Existing Accounting System contracts and production
          mappings remain To Be Confirmed.
        </p>
      </SectionCard>

      <SectionCard title="Transfer batches" eyebrow="Prepared Accounting payload records">
        <AccountingTransferBatchTable />
      </SectionCard>

      <div className="two-column accounting-issues-grid">
        <SectionCard title="Blocked transfers" eyebrow="Held before Accounting handoff">
          <BlockedAccountingTransfersTable />
        </SectionCard>
        <SectionCard title="Failed transfers" eyebrow="Retry queue">
          <FailedAccountingTransfersTable />
        </SectionCard>
      </div>

      <div className="two-column accounting-health-grid">
        <SectionCard title="Accounting integration health" eyebrow="Technical status">
          <div className="panel-body accounting-health-list">
            {accountingHealthMetrics.map((metric) => (
              <div className="accounting-health-item" key={metric.label}>
                <span>{metric.label}</span>
                <StatusBadge tone={metric.tone}>{metric.value}</StatusBadge>
              </div>
            ))}
            <div className="accounting-health-summary">
              <strong>Operational in prototype mode</strong>
              <p>Last mock sync: September 18, 2026 · 09:15 AM</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Synchronization history" eyebrow="Transfer traceability">
          <AccountingSynchronizationHistoryTable />
        </SectionCard>
      </div>

      <SectionCard title="Audit visibility" eyebrow="Future traceability">
        <div className="panel-body accounting-audit-grid">
          <div>
            <Icon name="audit" />
            <strong>Accounting transfer actions should be auditable.</strong>
            <p>
              Future integration records should retain transfer ID, Payroll batch ID, prepared by, prepared at,
              transferred at, acknowledgement time, retry count, and transfer result.
            </p>
          </div>
          <StatusBadge tone="muted">Audit log integration · To Be Confirmed</StatusBadge>
        </div>
      </SectionCard>

      <section className="accounting-boundary-notice">
        <Icon name="shield" />
        <div>
          <p className="section-kicker">Integration boundary</p>
          <h2>Approved Payroll information is the only downstream source shown here.</h2>
          <p>
            Payroll computation remains the responsibility of the Existing Payroll System. Journal entries, ledger
            posting, financial reconciliation, and accounting reports remain the responsibility of the Existing
            Accounting System.
          </p>
        </div>
      </section>
    </div>
  );
}
