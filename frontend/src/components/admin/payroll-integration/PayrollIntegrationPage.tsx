import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { IconName } from "@/types/ui";

import {
  payrollFieldMappings,
  payrollValidationChecks,
} from "@/data/payroll";

import {
  BlockedRecordsTable,
  FailedTransfersTable,
  PayrollFieldMappingTable,
  PayrollReadyTable,
  SynchronizationHistoryTable,
  TransferBatchTable,
} from "./PayrollIntegrationTables";

const payrollSummaryMetrics = [
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
    note: "Prototype acknowledgements",
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
  { label: "Pending Attendance Review", value: "5", percent: 22, tone: "warning" as const },
  { label: "Pending Correction Approval", value: "3", percent: 16, tone: "warning" as const },
  { label: "Blocked by Validation", value: "2", percent: 10, tone: "warning" as const },
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
        description={
          "Monitor the preparation and transfer of verified attendance records to the Existing Payroll System."
        }
        actions={
          <ActionButton icon="refresh" action="Payroll integration mock data refreshed.">
            Refresh integration
          </ActionButton>
        }
      />

      <section className="notice payroll-notice">
        <Icon name="info" />
        <p>
          <strong>Prototype / Simulated integration.</strong> This page prepares and monitors attendance payloads only;
          it does not contact a live Payroll API or calculate payroll.
        </p>
      </section>

      <div className="metric-grid payroll-metrics">
        {payrollSummaryMetrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <div className={`metric-icon metric-icon-${metric.tone}`}>
              <Icon name={metric.icon} />
            </div>
            <div className="metric-content">
              <p className="metric-label">{metric.label}</p>
              <p className="metric-value">{metric.value}</p>
              <p className="metric-note">{metric.note}</p>
            </div>
          </article>
        ))}
      </div>

      <SectionCard title="Payroll transfer period" eyebrow="Prototype period">
        <div className="panel-body">
          <div className="payroll-period-grid">
            <div className="payroll-period-item payroll-period-highlight">
              <span>Period</span>
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
              <small>Ready for payload preparation</small>
            </div>
            <div className="payroll-period-item">
              <span>Pending review</span>
              <strong>8</strong>
              <small>Must remain outside transfer</small>
            </div>
          </div>
          <div className="payroll-period-note">
            <Icon name="calendar" />
            <p>
              Period and readiness values are illustrative prototype data. The Existing Payroll System remains responsible
              for its own payroll schedule and cutoff rules.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Payroll integration flow" eyebrow="Verified attendance to acknowledgement">
        <FlowDiagram
          className="payroll-flow"
          nodes={[
            {
              label: "Unified Attendance",
              detail: "Standardized records",
              icon: "unified",
              status: "Processed",
              tone: "info",
            },
            {
              label: "Validation",
              detail: "Required fields",
              icon: "shield",
              status: "Checked",
              tone: "success",
            },
            {
              label: "Correction / Approval",
              detail: "Review gate",
              icon: "users",
              status: "Required",
              tone: "warning",
            },
            {
              label: "Verified Attendance",
              detail: "Transfer eligible",
              icon: "check",
              status: "Ready",
              tone: "success",
            },
            {
              label: "Payload Preparation",
              detail: "Attendance fields",
              icon: "file",
              status: "Mapped",
              tone: "info",
            },
            {
              label: "Existing Payroll",
              detail: "External system",
              icon: "building",
              status: "Prototype",
              tone: "muted",
            },
            {
              label: "Acknowledgement",
              detail: "Transfer result",
              icon: "arrow",
              status: "Tracked",
              tone: "info",
            },
          ]}
        />
        <p className="data-flow-note">
          Only verified attendance is eligible for Payroll transfer. Processed attendance is not automatically Payroll
          Ready.
        </p>
      </SectionCard>

      <div className="two-column payroll-overview-grid">
        <SectionCard title="Payroll readiness overview" eyebrow="Transfer gate">
          <div className="panel-body">
            <ProgressList items={readinessItems} />
          </div>
        </SectionCard>

        <SectionCard title="Payload validation" eyebrow="Pre-transfer checks">
          <div className="panel-body payroll-validation-list">
            {payrollValidationChecks.map((check) => (
              <div className="payroll-validation-item" key={check.label}>
                <span className={`payroll-validation-icon status-${check.tone}`}>
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
              <span className="payroll-safeguard-icon"><Icon name="shield" /></span>
              <span>
                <strong>Duplicate transfer protection</strong>
                <small>Previously acknowledged records are checked before a new prototype batch is prepared.</small>
              </span>
              <StatusBadge tone="success">Active · Prototype</StatusBadge>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Payroll-ready attendance"
        eyebrow="Verified attendance evaluation"
        actions={<StatusBadge tone="info">Sample data</StatusBadge>}
      >
        <PayrollReadyTable />
      </SectionCard>

      <SectionCard title="Attendance → Payroll field mapping" eyebrow="Prototype mapping">
        <PayrollFieldMappingTable mappings={payrollFieldMappings} />
        <p className="data-flow-note">
          Attendance-related field names are prototype examples. Production Payroll contracts and any unresolved
          attendance rules remain To Be Confirmed.
        </p>
      </SectionCard>

      <SectionCard title="Transfer batches" eyebrow="Prepared payload records">
        <TransferBatchTable />
      </SectionCard>

      <div className="two-column payroll-issues-grid">
        <SectionCard title="Blocked records" eyebrow="Held from Payroll">
          <BlockedRecordsTable />
        </SectionCard>
        <SectionCard title="Failed transfers" eyebrow="Retry queue">
          <FailedTransfersTable />
        </SectionCard>
      </div>

      <div className="two-column payroll-health-grid-layout">
        <SectionCard title="Integration health" eyebrow="Existing Payroll System">
          <div className="panel-body payroll-health-list">
            {healthMetrics.map((metric) => (
              <div className="payroll-health-item" key={metric.label}>
                <span>{metric.label}</span>
                <StatusBadge tone={metric.tone}>{metric.value}</StatusBadge>
              </div>
            ))}
            <div className="payroll-health-summary">
              <strong>Operational in prototype mode</strong>
              <p>Last mock sync: September 23, 2026 · 10:42 AM</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Synchronization history" eyebrow="Transfer traceability">
          <SynchronizationHistoryTable />
        </SectionCard>
      </div>

      <SectionCard title="Audit coverage" eyebrow="Future traceability">
        <div className="panel-body payroll-audit-grid">
          <div>
            <Icon name="audit" />
            <strong>Transfer actions should be auditable.</strong>
            <p>
              Future integration records should retain batch ID, prepared by, prepared at, transferred at,
              acknowledgement time, retry count, and transfer result.
            </p>
          </div>
          <StatusBadge tone="muted">Audit log integration · To Be Confirmed</StatusBadge>
        </div>
      </SectionCard>

      <section className="payroll-boundary-notice">
        <Icon name="shield" />
        <div>
          <p className="section-kicker">Integration boundary</p>
          <h2>Attendance transfer is the responsibility of this application.</h2>
          <p>
            Payroll computation, salary calculation, deductions, benefits, payslip generation, payroll release,
            and financial processing remain functions of the Existing Payroll System and are outside this application.
          </p>
        </div>
      </section>
    </div>
  );
}
