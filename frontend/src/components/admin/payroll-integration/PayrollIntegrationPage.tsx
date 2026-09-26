import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { IconName } from "@/types/ui";

import { payrollFieldMappings, payrollValidationChecks } from "@/data/payroll";

import {
  BlockedRecordsTable,
  FailedTransfersTable,
  PayrollFieldMappingTable,
  PayrollReadyTable,
  SynchronizationHistoryTable,
  TransferBatchTable,
} from "./PayrollIntegrationTables";

const summaryMetrics = [
  {
    label: "Payroll-ready employees",
    value: "124",
    note: "Verified attendance only",
    icon: "check" as const,
    tone: "success" as const,
  },
  {
    label: "Pending review",
    value: "8",
    note: "Held from transfer",
    icon: "clock" as const,
    tone: "warning" as const,
  },
  {
    label: "Successful transfers",
    value: "116",
    note: "Acknowledgements received",
    icon: "arrow" as const,
    tone: "info" as const,
  },
  {
    label: "Failed transfers",
    value: "2",
    note: "Retry attention needed",
    icon: "warning" as const,
    tone: "danger" as const,
  },
];

const readinessItems = [
  { label: "Ready for Payroll", value: "124", percent: 88, tone: "success" as const },
  { label: "Pending HR verification", value: "5", percent: 22, tone: "warning" as const },
  { label: "Correction requests pending", value: "3", percent: 16, tone: "warning" as const },
  { label: "Blocked by validation", value: "2", percent: 10, tone: "warning" as const },
  { label: "Transferred", value: "116", percent: 82, tone: "success" as const },
];

const validationIcons: Record<string, IconName> = {
  Passed: "check",
  Warning: "warning",
  Failed: "errors",
};

const healthMetrics = [
  { label: "Payroll connection", value: "Prototype / Simulated", tone: "info" as const },
  { label: "Last successful transfer", value: "PAY-2026-09-A", tone: "success" as const },
  { label: "Last acknowledgement", value: "Received · 10:42 AM", tone: "success" as const },
  { label: "Pending transfers", value: "1 batch", tone: "warning" as const },
];

export function PayrollIntegrationPage() {
  return (
    <div className="admin-page payroll-page">
      <AdminPageHeader
        eyebrow="Downstream integration"
        title="Payroll Integration"
        description="Monitor the preparation and transfer of verified attendance records to the Existing Payroll System."
        actions={(
          <ActionButton icon="refresh" action="Payroll integration mock data refreshed.">
            Refresh integration
          </ActionButton>
        )}
      />

      <section className="notice payroll-notice" aria-label="Payroll integration boundary">
        <Icon name="info" />
        <p>
          <strong>Simulated integration.</strong> This workspace prepares and monitors attendance payloads. The
          Existing Payroll System owns payroll calculations and cutoff rules.
        </p>
      </section>

      <section className="metric-grid payroll-metrics" aria-label="Payroll transfer summary">
        {summaryMetrics.map((metric) => (
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

      <SectionCard
        className="payroll-section"
        title="Payroll transfer period"
        eyebrow="Attendance handoff"
        actions={<StatusBadge tone="info">Sep 1–15, 2026</StatusBadge>}
      >
        <div className="panel-body">
          <div className="payroll-period-grid">
            <div className="payroll-period-item payroll-period-highlight">
              <span>Selected period</span>
              <strong>September 1–15, 2026</strong>
              <small>Official cutoff rules: To Be Confirmed</small>
            </div>
            <div className="payroll-period-item">
              <span>Eligible employees</span>
              <strong>124</strong>
              <small>Verified attendance records</small>
            </div>
            <div className="payroll-period-item">
              <span>Verified records</span>
              <strong>232</strong>
              <small>Available for payload preparation</small>
            </div>
            <div className="payroll-period-item">
              <span>Held from transfer</span>
              <strong>8</strong>
              <small>Pending review or validation</small>
            </div>
          </div>
          <p className="payroll-period-note">
            <Icon name="calendar" />
            <span>Period and readiness values are illustrative. Payroll remains responsible for its schedule and cutoff rules.</span>
          </p>
        </div>
      </SectionCard>

      <SectionCard className="payroll-section" title="Payroll integration flow" eyebrow="Verified attendance to acknowledgement">
        <FlowDiagram
          className="payroll-flow"
          nodes={[
            { label: "Unified Attendance", detail: "Standardized records", icon: "unified", status: "Processed", tone: "info" },
            { label: "Validation", detail: "Required fields", icon: "shield", status: "Checked", tone: "success" },
            { label: "Correction Review", detail: "Requests resolved", icon: "users", status: "Reviewed", tone: "warning" },
            { label: "HR Verification", detail: "Final attendance check", icon: "check", status: "Required", tone: "success" },
            { label: "Payload Preparation", detail: "Attendance fields", icon: "file", status: "Mapped", tone: "info" },
            { label: "Existing Payroll", detail: "External system", icon: "building", status: "Simulated", tone: "muted" },
            { label: "Acknowledgement", detail: "Transfer result", icon: "arrow", status: "Tracked", tone: "info" },
          ]}
        />
        <p className="data-flow-note payroll-flow-note">
          Only attendance that passes validation, has no correction request or has an approved correction, and receives
          final HR verification is eligible for transfer.
        </p>
      </SectionCard>

      <div className="payroll-overview-grid">
        <SectionCard className="payroll-section" title="Payroll readiness" eyebrow="Transfer gate">
          <div className="panel-body">
            <ProgressList items={readinessItems} />
          </div>
        </SectionCard>

        <SectionCard className="payroll-section" title="Payload validation" eyebrow="Pre-transfer checks">
          <div className="panel-body payroll-validation-list">
            {payrollValidationChecks.map((check) => (
              <div className="payroll-validation-item" key={check.label}>
                <span className={`payroll-validation-icon status-${check.tone}`} aria-hidden="true">
                  <Icon name={validationIcons[check.status]} />
                </span>
                <span className="payroll-validation-copy">
                  <strong>{check.label}</strong>
                  <small>{check.detail}</small>
                </span>
                <StatusBadge tone={check.tone}>{check.status}</StatusBadge>
              </div>
            ))}
            <div className="payroll-safeguard">
              <span className="payroll-safeguard-icon" aria-hidden="true"><Icon name="shield" /></span>
              <span>
                <strong>Duplicate transfer protection</strong>
                <small>Acknowledged records are checked before a prototype batch is prepared.</small>
              </span>
              <StatusBadge tone="success">Active · Simulated</StatusBadge>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        className="payroll-section"
        title="Payroll-ready attendance"
        eyebrow="Verified attendance evaluation"
        actions={<StatusBadge tone="info">Sample records</StatusBadge>}
      >
        <PayrollReadyTable />
      </SectionCard>

      <SectionCard className="payroll-section" title="Attendance to Payroll field mapping" eyebrow="Prototype payload mapping">
        <PayrollFieldMappingTable mappings={payrollFieldMappings} />
        <p className="data-flow-note payroll-flow-note">
          Field names are examples. Production Payroll contracts and unresolved attendance rules remain To Be Confirmed.
        </p>
      </SectionCard>

      <SectionCard className="payroll-section" title="Transfer batches" eyebrow="Prepared attendance payloads">
        <TransferBatchTable />
      </SectionCard>

      <div className="payroll-overview-grid">
        <SectionCard className="payroll-section" title="Blocked records" eyebrow="Held from Payroll">
          <BlockedRecordsTable />
        </SectionCard>
        <SectionCard className="payroll-section" title="Failed transfers" eyebrow="Retry queue">
          <FailedTransfersTable />
        </SectionCard>
      </div>

      <div className="payroll-overview-grid payroll-health-grid-layout">
        <SectionCard className="payroll-section" title="Integration health" eyebrow="Existing Payroll System">
          <div className="panel-body payroll-health-list">
            {healthMetrics.map((metric) => (
              <div className="payroll-health-item" key={metric.label}>
                <span>{metric.label}</span>
                <StatusBadge tone={metric.tone}>{metric.value}</StatusBadge>
              </div>
            ))}
            <div className="payroll-health-summary">
              <strong>Monitoring in simulated mode</strong>
              <p>Last mock sync: September 23, 2026 · 10:42 AM</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="payroll-section" title="Synchronization history" eyebrow="Transfer traceability">
          <SynchronizationHistoryTable />
        </SectionCard>
      </div>

      <SectionCard className="payroll-section" title="Audit coverage" eyebrow="Future traceability">
        <div className="panel-body payroll-audit-grid">
          <div>
            <Icon name="audit" />
            <strong>Transfer actions should be auditable.</strong>
            <p>Future integration records should retain batch ID, prepared by, timestamps, acknowledgement, retry count, and transfer result.</p>
          </div>
          <StatusBadge tone="muted">Audit log integration · To Be Confirmed</StatusBadge>
        </div>
      </SectionCard>

      <section className="payroll-boundary-notice" aria-labelledby="payroll-boundary-heading">
        <Icon name="shield" />
        <div>
          <p className="section-kicker">Integration boundary</p>
          <h2 id="payroll-boundary-heading">This application transfers verified attendance records.</h2>
          <p>Payroll computation, salary and deduction calculations, payslip generation, release, and financial processing remain in the Existing Payroll System.</p>
        </div>
      </section>
    </div>
  );
}
