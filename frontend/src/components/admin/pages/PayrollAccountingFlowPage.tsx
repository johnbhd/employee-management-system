import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  payrollAccountingFlow,
  payrollAccountingHealth,
  payrollAccountingReadinessItems,
  payrollAccountingSummaryMetrics,
  payrollAccountingValidationChecks,
} from "@/data/payroll-accounting-flow";
import type { IconName } from "@/types/ui";

import {
  PayrollAccountingExceptionTable,
  PayrollAccountingFieldMappingTable,
  PayrollAccountingSynchronizationHistoryTable,
  PayrollAccountingTransferQueueTable,
} from "./PayrollAccountingFlowTables";

const validationIcons: Record<string, IconName> = {
  Passed: "check",
  Warning: "warning",
  Failed: "errors",
};

export function PayrollAccountingFlowPage() {
  return (
    <div className="admin-page payroll-accounting-flow-page">
      <AdminPageHeader
        eyebrow="Downstream integration"
        title="Payroll Integration"
        description="Review verified attendance preparation and the controlled handoff to the Existing Payroll System."
        actions={(
          <>
            <ActionButton icon="refresh" action="Payroll integration mock data refreshed.">
              Refresh integration
            </ActionButton>
            <Link className="button-secondary" href="/admin/unified-attendance">
              Review unified attendance
            </Link>
          </>
        )}
      />

      <section className="notice payroll-accounting-flow-notice" aria-label="Payroll integration boundary">
        <Icon name="info" />
        <p>
          <strong>Prototype / simulated integration.</strong> This workspace monitors verified attendance transfer;
          it does not calculate salary, deductions, payroll totals, or payslips.
        </p>
      </section>

      <section className="metric-grid payroll-accounting-flow-summary" aria-label="Payroll transfer summary">
        {payrollAccountingSummaryMetrics.map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </section>

      <SectionCard title="Payroll data flow" eyebrow="Verified attendance to acknowledgement">
        <FlowDiagram className="payroll-accounting-flow" nodes={payrollAccountingFlow} />
        <p className="data-flow-note payroll-accounting-flow-note">
          The flow makes each Payroll stage visible: verified attendance is prepared, validated, transferred, and
          acknowledged without moving Payroll computation into this application.
        </p>
      </SectionCard>

      <SectionCard title="System ownership" eyebrow="Integration boundary">
        <div className="panel-body payroll-accounting-ownership-grid">
          <div className="payroll-accounting-ownership-node">
            <span className="payroll-accounting-ownership-icon">
              <Icon name="unified" />
            </span>
            <span className="payroll-accounting-ownership-label">Upstream layer</span>
            <strong>Unified Attendance</strong>
            <StatusBadge tone="success">Verified source</StatusBadge>
          </div>
          <span className="payroll-accounting-ownership-arrow" aria-hidden="true">
            <Icon name="arrow" />
          </span>
          <div className="payroll-accounting-ownership-node payroll-accounting-ownership-node-active">
            <span className="payroll-accounting-ownership-icon">
              <Icon name="payroll" />
            </span>
            <span className="payroll-accounting-ownership-label">Monitored layer</span>
            <strong>Payroll Integration</strong>
            <StatusBadge tone="info">Prototype</StatusBadge>
          </div>
          <span className="payroll-accounting-ownership-arrow" aria-hidden="true">
            <Icon name="arrow" />
          </span>
          <div className="payroll-accounting-ownership-node">
            <span className="payroll-accounting-ownership-icon">
              <Icon name="building" />
            </span>
            <span className="payroll-accounting-ownership-label">Downstream system</span>
            <strong>Existing Payroll System</strong>
            <StatusBadge tone="muted">External</StatusBadge>
          </div>
        </div>
      </SectionCard>

      <div className="payroll-accounting-flow-overview">
        <SectionCard title="Payroll readiness" eyebrow="Transfer gate">
          <div className="panel-body">
            <ProgressList items={payrollAccountingReadinessItems} />
          </div>
        </SectionCard>

        <SectionCard title="Payload validation" eyebrow="Pre-transfer checks">
          <div className="panel-body payroll-accounting-validation-list">
            {payrollAccountingValidationChecks.map((check) => (
              <div className="payroll-accounting-validation-row" key={check.label}>
                <span className={`payroll-accounting-validation-icon status-${check.tone}`} aria-hidden="true">
                  <Icon name={validationIcons[check.status]} />
                </span>
                <span className="payroll-accounting-validation-copy">
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
        eyebrow="Verified attendance records"
        actions={<StatusBadge tone="info">Prototype data</StatusBadge>}
      >
        <PayrollAccountingTransferQueueTable />
      </SectionCard>

      <div className="payroll-accounting-flow-secondary">
        <SectionCard title="Field mapping" eyebrow="Prototype contract">
          <PayrollAccountingFieldMappingTable />
          <p className="data-flow-note payroll-accounting-table-note">
            Field names are illustrative. The production Payroll contract and ownership rules remain to be confirmed.
          </p>
        </SectionCard>

        <SectionCard title="Transfer health" eyebrow="Current prototype status">
          <div className="panel-body payroll-accounting-health-list">
            {payrollAccountingHealth.map((item) => (
              <div className="payroll-accounting-health-row" key={item.label}>
                <span>{item.label}</span>
                <StatusBadge tone={item.tone}>{item.value}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Blocked and failed transfers" eyebrow="Items requiring review">
        <PayrollAccountingExceptionTable />
      </SectionCard>

      <SectionCard title="Synchronization history" eyebrow="Transfer traceability">
        <PayrollAccountingSynchronizationHistoryTable />
      </SectionCard>

      <SectionCard title="Audit visibility" eyebrow="Future traceability">
        <div className="panel-body payroll-accounting-audit-panel">
          <div className="payroll-accounting-audit-copy">
            <span className="payroll-accounting-audit-icon" aria-hidden="true">
              <Icon name="audit" />
            </span>
            <div>
              <strong>Payroll transfer actions should be auditable.</strong>
              <p>
                Future records should retain transfer ID, attendance batch ID, prepared by, prepared at,
                acknowledgement time, retry count, and transfer result.
              </p>
            </div>
          </div>
          <StatusBadge tone="muted">Audit log integration · To Be Confirmed</StatusBadge>
        </div>
      </SectionCard>

      <section className="payroll-accounting-flow-boundary">
        <Icon name="shield" />
        <div>
          <p className="section-kicker">Integration boundary</p>
          <h2>Verified attendance is the only downstream source shown here.</h2>
          <p>
            Payroll computation, salary and deduction calculations, payslip generation, release, and financial
            processing remain the responsibility of the Existing Payroll System.
          </p>
        </div>
      </section>
    </div>
  );
}
