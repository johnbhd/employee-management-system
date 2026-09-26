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
  payrollRebuildFlow,
  payrollRebuildHealth,
  payrollRebuildIssues,
  payrollRebuildMetrics,
  payrollRebuildReadiness,
  payrollRebuildTransfers,
} from "@/data/payroll-integration-rebuild";

import { PayrollIntegrationTable } from "./PayrollIntegrationTable";

export function PayrollIntegrationPage() {
  return (
    <div className="admin-page payroll-integration-rebuild">
      <AdminPageHeader
        eyebrow="Integration control center / Downstream"
        title="Payroll Integration"
        description="Review verified attendance readiness, follow the transfer path, and monitor the handoff to the Existing Payroll System."
        actions={(
          <>
            <ActionButton icon="refresh" action="Payroll integration data refreshed.">
              Refresh data
            </ActionButton>
            <Link className="button-primary" href="/admin/unified-attendance">
              Open unified attendance
            </Link>
          </>
        )}
      />

      <div className="metric-grid payroll-rebuild-metrics" aria-label="Payroll integration summary">
        {payrollRebuildMetrics.map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="two-column">
        <SectionCard title="Payroll system health" eyebrow="Current connection">
          <div className="panel-body list-stack payroll-rebuild-health-list">
            {payrollRebuildHealth.map((item) => (
              <div className="list-row payroll-rebuild-health-row" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.detail}</p>
                </div>
                <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Transfer readiness" eyebrow="Verified attendance">
          <div className="panel-body">
            <ProgressList items={payrollRebuildReadiness} />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Verified attendance flow" eyebrow="Source to Payroll boundary">
        <FlowDiagram className="payroll-rebuild-flow" nodes={payrollRebuildFlow} />
        <p className="data-flow-note payroll-rebuild-flow-note">
          Verified attendance is checked and prepared before it reaches the external Payroll boundary. This page does
          not calculate salary, deductions, payroll totals, or payslips.
        </p>
      </SectionCard>

      <SectionCard
        title="Payroll-ready attendance"
        eyebrow="Transfer review queue"
        actions={<StatusBadge tone="info">Sample records</StatusBadge>}
      >
        <PayrollIntegrationTable />
      </SectionCard>

      <div className="two-column-wide">
        <SectionCard title="Items needing attention" eyebrow="Operational queue">
          <div className="panel-body issue-list payroll-rebuild-issues">
            {payrollRebuildIssues.map((issue) => (
              <article className={`issue-card ${issue.tone}`} key={issue.title}>
                <div>
                  <h3>{issue.title}</h3>
                  <p>{issue.detail}</p>
                  <small>{issue.time}</small>
                </div>
                <ActionButton
                  variant="link"
                  icon="info"
                  action={`${issue.title} opened in prototype mode.`}
                >
                  Review
                </ActionButton>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent transfer activity" eyebrow="Traceability">
          <div className="panel-body timeline-list payroll-rebuild-transfer-list">
            {payrollRebuildTransfers.map((transfer) => (
              <div className="timeline-item" key={transfer.batch}>
                <div>
                  <strong>{transfer.batch} · {transfer.operation}</strong>
                  <p>{transfer.records} · {transfer.detail}</p>
                </div>
                <div className="payroll-rebuild-transfer-meta">
                  <StatusBadge tone={transfer.status.tone}>{transfer.status.label}</StatusBadge>
                  <small>{transfer.time}</small>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Payroll integration boundary" eyebrow="System ownership">
        <div className="panel-body payroll-rebuild-boundary">
          <span className="payroll-rebuild-boundary-icon" aria-hidden="true">
            <Icon name="shield" />
          </span>
          <div>
            <strong>Verified attendance only</strong>
            <p>
              This application prepares and monitors verified attendance records. Payroll computation, salary and
              deduction calculations, payslip generation, release, and financial processing remain in the Existing
              Payroll System.
            </p>
          </div>
          <StatusBadge tone="muted">External owner</StatusBadge>
        </div>
      </SectionCard>

      <p className="page-feedback payroll-rebuild-feedback">
        <Icon name="info" />
        Mock integration data only. No external Payroll calls are made.
      </p>
    </div>
  );
}
