import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { FilterableTable } from "@/components/ui/FilterableTable";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  integrationErrorRecords,
  integrationErrorResolutionEvents,
  integrationErrorSystems,
} from "@/data/integration-errors";

const errorFlow = [
  {
    label: "Source systems",
    detail: "HRPS · Bundy · QR",
    icon: "layers",
    status: "Captured",
    tone: "success",
  },
  {
    label: "Integration layer",
    detail: "Validate + normalize",
    icon: "shield",
    status: "Processing",
    tone: "info",
  },
  {
    label: "Error queue",
    detail: "Isolate + classify",
    icon: "errors",
    status: "4 open",
    tone: "danger",
  },
  {
    label: "Review / recovery",
    detail: "Retry + resolve",
    icon: "users",
    status: "Controlled",
    tone: "warning",
  },
  {
    label: "Downstream",
    detail: "Payroll · accounting",
    icon: "building",
    status: "Protected",
    tone: "muted",
  },
] as const;

const queueRows = integrationErrorRecords.map((record) => ({
  id: record.id,
  source: record.source,
  category: record.category,
  summary: record.summary,
  affected: record.affected,
  severity: record.severity,
  status: record.status,
  occurredAt: record.occurredAt,
}));

export function IntegrationErrorsPage() {
  const openErrors = integrationErrorRecords.filter((record) => record.status !== "Resolved");
  const criticalErrors = openErrors.filter((record) => record.severity === "Critical");
  const retryPending = integrationErrorRecords.filter((record) => record.status === "Retry pending");
  const resolvedErrors = integrationErrorRecords.filter((record) => record.status === "Resolved");

  const summaryMetrics = [
    {
      label: "Open errors",
      value: String(openErrors.length),
      note: "Review required",
      icon: "errors" as const,
      tone: "danger" as const,
    },
    {
      label: "Critical errors",
      value: String(criticalErrors.length),
      note: "Immediate attention",
      icon: "warning" as const,
      tone: "danger" as const,
    },
    {
      label: "Retry pending",
      value: String(retryPending.length),
      note: "Held before transfer",
      icon: "refresh" as const,
      tone: "warning" as const,
    },
    {
      label: "Resolved today",
      value: String(resolvedErrors.length),
      note: "Closed in prototype queue",
      icon: "check" as const,
      tone: "success" as const,
    },
  ];

  return (
    <div className="admin-page integration-errors-page">
      <AdminPageHeader
        eyebrow="Operations / Error handling"
        title="Integration Errors"
        description="Trace failed handoffs, protect downstream systems, and keep recovery work visible across the employee data boundary."
        actions={
          <ActionButton icon="refresh" action="Integration error queue refreshed in the prototype.">
            Refresh error queue
          </ActionButton>
        }
      />

      <div className="metric-grid integration-error-metrics">
        {summaryMetrics.map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </div>

      <SectionCard title="Error handling flow" eyebrow="Detect, isolate, recover">
        <FlowDiagram className="integration-error-flow" nodes={errorFlow} />
        <p className="data-flow-note">
          Failed records are isolated at the integration layer before a reviewer retries or resolves them. Downstream
          Payroll and Accounting boundaries remain protected from unverified records.
        </p>
      </SectionCard>

      <div className="two-column">
        <SectionCard title="System health" eyebrow="Monitored boundaries">
          <div className="panel-body integration-error-health-list">
            {integrationErrorSystems.map((system) => (
              <Link className="integration-error-health-card" href={system.href} key={system.name}>
                <span className="integration-error-health-icon">
                  <Icon name={system.icon} />
                </span>
                <span className="integration-error-health-copy">
                  <strong>{system.name}</strong>
                  <small>{system.purpose}</small>
                  <span>Last check {system.lastCheck}</span>
                </span>
                <StatusBadge tone={system.tone}>{system.status}</StatusBadge>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Queue summary" eyebrow="Current review load">
          <div className="panel-body">
            <ProgressList
              items={[
                { label: "Errors triaged", value: "82%", percent: 82, tone: "success" },
                { label: "Retry eligibility confirmed", value: "64%", percent: 64, tone: "warning" },
                { label: "Source references matched", value: "96%", percent: 96, tone: "success" },
              ]}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Open error queue" eyebrow="Filterable review list">
        <FilterableTable
          rows={queueRows}
          columns={[
            { key: "id", label: "Error ID" },
            { key: "source", label: "Source" },
            { key: "category", label: "Category" },
            { key: "summary", label: "Error" },
            { key: "affected", label: "Affected reference" },
            { key: "severity", label: "Severity" },
            { key: "status", label: "Status" },
            { key: "occurredAt", label: "Occurred" },
          ]}
          filters={[
            {
              key: "source",
              label: "Source",
              options: ["All", ...integrationErrorSystems.map((system) => system.name)],
            },
            {
              key: "status",
              label: "Status",
              options: ["All", "Open", "Retry pending", "Under review", "Resolved"],
            },
          ]}
          searchPlaceholder="Search error queue"
          caption="Integration error queue"
          emptyMessage="No integration errors match the selected filters."
          note="Mock queue · no live error feed"
        />
      </SectionCard>

      <div className="two-column">
        <SectionCard title="Recovery actions" eyebrow="Prototype controls">
          <div className="panel-body integration-error-action-list">
            <div className="integration-error-action-row">
              <div>
                <strong>Retry eligible records</strong>
                <p>Queue only records that passed the source and validation checks.</p>
              </div>
              <ActionButton icon="refresh" action="Eligible retries queued in the prototype.">
                Queue retries
              </ActionButton>
            </div>
            <div className="integration-error-action-row">
              <div>
                <strong>Review source references</strong>
                <p>Open the monitoring workspace before confirming a correction.</p>
              </div>
              <Link className="button-link" href="/admin/integration-monitoring">
                View monitoring
                <Icon name="arrow" />
              </Link>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Recovery guardrails" eyebrow="Protected handoff">
          <div className="panel-body integration-error-guardrail-list">
            <div>
              <Icon name="shield" />
              <span>
                <strong>Unverified records stay isolated</strong>
                <small>Errors do not continue to downstream systems automatically.</small>
              </span>
            </div>
            <div>
              <Icon name="check" />
              <span>
                <strong>Resolution remains traceable</strong>
                <small>Every retry or review decision belongs to the prototype queue.</small>
              </span>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Recent resolution activity" eyebrow="Traceability">
        <div className="table-wrap integration-error-resolution-table">
          <table className="data-table">
            <caption className="sr-only">Recent integration error resolution activity</caption>
            <thead>
              <tr>
                <th>Time</th>
                <th>Activity</th>
                <th>Detail</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {integrationErrorResolutionEvents.map((event) => (
                <tr key={event.event}>
                  <td>{event.time}</td>
                  <td>{event.event}</td>
                  <td>{event.detail}</td>
                  <td><StatusBadge tone={event.tone}>{event.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <section className="notice integration-error-boundary">
        <Icon name="shield" />
        <div>
          <strong>Integration boundary</strong>
          <p>
            This page represents an operational review queue. It does not contact Payroll, Accounting, HRPS, or
            attendance source systems.
          </p>
        </div>
      </section>

      <p className="page-feedback">
        <Icon name="info" />
        Mock queue snapshot · error details and recovery actions are illustrative.
      </p>
    </div>
  );
}
