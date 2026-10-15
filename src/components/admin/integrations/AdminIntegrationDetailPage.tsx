"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type {
  AdminIntegrationActivity,
  AdminIntegrationHealth,
  AdminIntegrationIssue,
  AdminIntegrationMonitoringData,
  AdminIntegrationMode,
  AdminIntegrationStatus,
} from "@/types/admin-integration-monitoring";
import type { Metric, StatusTone } from "@/types/ui";

type MonitoringApiResponse = ApiSuccessResponse<AdminIntegrationMonitoringData>;

export type AdminIntegrationDetailConfig = {
  key: string;
  title: string;
  description: string;
  integrationKeys: readonly string[];
  sourceLabel: string;
  sourceDescription: string;
  technicalSummaryTitle: string;
  technicalSummaryDescription: string;
  futureWorkflow: {
    title: string;
    description: string;
    status: string;
  };
  capabilities: ReadonlyArray<{
    label: string;
    detail: string;
  }>;
  emptyActivityMessage: string;
  emptyIssueMessage: string;
};

export const adminIntegrationDetailConfigs = {
  hrps: {
    key: "hrps",
    title: "HRPS Integration",
    description: "Monitor the HRPS employee and schedule synchronization boundary without changing authoritative HR records outside an explicit import.",
    integrationKeys: ["hrps"],
    sourceLabel: "Prisma / Supabase PostgreSQL",
    sourceDescription: "HRPS CSV records are validated server-side and synchronized to PostgreSQL through the Prisma repository boundary.",
    technicalSummaryTitle: "Controlled CSV synchronization",
    technicalSummaryDescription: "Use the HRPS workspace to preview, review, confirm, and audit employee and structured schedule synchronization.",
    futureWorkflow: {
      title: "Import Source",
      description: "The HRPS workspace supports CSV upload, field validation, PostgreSQL comparison, explicit confirmation, bounded synchronization, and import history.",
      status: "Configured",
    },
    capabilities: [
      { label: "Employee synchronization", detail: "Preview and confirm HRPS-owned employee changes through PostgreSQL." },
      { label: "Schedule synchronization", detail: "Validate and persist structured schedule rows without duplicate unchanged records." },
      { label: "Source ownership", detail: "HRPS remains authoritative for employee business data." },
      { label: "HR business actions", detail: "Attendance verification, corrections, and policy decisions remain outside this technical import boundary." },
    ],
    emptyActivityMessage: "No confirmed HRPS synchronization activity is recorded yet.",
    emptyIssueMessage: "No HRPS integration issues are recorded.",
  },
  bundy: {
    key: "bundy",
    title: "Bundy / Biometric ETL",
    description: "Upload and monitor raw Bundy Clock event ingestion without inferring final attendance policy outcomes.",
    integrationKeys: ["bundy"],
    sourceLabel: "Prisma Bundy raw-event repository",
    sourceDescription: "Bundy CSV rows are validated, matched to PostgreSQL HRPS Employees, and stored as immutable raw source evidence.",
    technicalSummaryTitle: "Controlled CSV raw-event import",
    technicalSummaryDescription: "Use the Bundy workspace to preview, independently match, confirm, and audit raw device events without calculating final attendance.",
    futureWorkflow: {
      title: "Import Source",
      description: "CSV upload, source validation, Employee matching, duplicate-scan classification, bounded raw persistence, and import history are available.",
      status: "Configured",
    },
    capabilities: [
      { label: "Employee matching", detail: "device_employee_id is matched as text to HRPS-owned PostgreSQL Employee.employee_id values." },
      { label: "Raw evidence", detail: "Valid IN/OUT events retain source IDs, timestamps, devices, source batches, and nullable Employee links." },
      { label: "Duplicate protection", detail: "Rapid duplicate scans are marked and source log IDs remain idempotent." },
      { label: "Attendance policy", detail: "Late, overtime, undertime, and approval rules remain outside this page." },
      { label: "Import history", detail: "Safe counts, source devices, batches, status, and Admin actor metadata are persisted." },
    ],
    emptyActivityMessage: "No confirmed Bundy import activity is recorded yet.",
    emptyIssueMessage: "No Bundy import issues are recorded.",
  },
  qr: {
    key: "qr",
    title: "QR Attendance",
    description: "Review the technical QR attendance write boundary and persisted source activity.",
    integrationKeys: ["qr-attendance"],
    sourceLabel: "Server QR signing and PostgreSQL attendance repository",
    sourceDescription: "QR tokens are validated server-side and accepted attendance writes are persisted through the Prisma/PostgreSQL attendance boundary.",
    technicalSummaryTitle: "Scanner and write boundary",
    technicalSummaryDescription: "This workspace reports QR attendance activity and technical status. It does not add file import or HR approval controls.",
    futureWorkflow: {
      title: "QR technical activity",
      description: "Use the existing Employee and HR scanner flows for QR writes. This Admin page is read-only technical monitoring for the same server-owned boundary.",
      status: "Read-only monitoring",
    },
    capabilities: [
      { label: "Signing configuration", detail: "The server reports whether QR signing is configured without exposing its secret." },
      { label: "Attendance writes", detail: "Persisted QR attendance records are reflected in the monitoring read model." },
      { label: "Validation boundary", detail: "Token and employee validation remain server-owned." },
      { label: "HR review", detail: "Attendance verification and correction decisions remain in the HR workspace." },
    ],
    emptyActivityMessage: "No QR attendance write activity is recorded yet.",
    emptyIssueMessage: "No QR integration issues are recorded.",
  },
  unified: {
    key: "unified",
    title: "Unified Attendance",
    description: "Inspect the technical convergence of attendance records from the supported source boundaries.",
    integrationKeys: ["unified-attendance"],
    sourceLabel: "PostgreSQL attendance repository",
    sourceDescription: "Unified attendance is represented by the PostgreSQL persisted attendance read model that preserves source information.",
    technicalSummaryTitle: "Standardized attendance boundary",
    technicalSummaryDescription: "This page is a technical convergence view. It does not perform HR final verification or replace source-specific attendance workflows.",
    futureWorkflow: {
      title: "Standardization activity",
      description: "Future source integrations may add richer distribution, matching, and validation evidence here. Current values remain limited to the persisted attendance read model.",
      status: "Read-only monitoring",
    },
    capabilities: [
      { label: "Persisted record availability", detail: "The monitoring read model reports the current attendance record boundary." },
      { label: "Source distinction", detail: "Bundy and QR remain separate source concepts even when records are standardized." },
      { label: "Technical validation", detail: "Available persisted technical outcomes remain visible without inventing policy decisions." },
      { label: "HR final verification", detail: "Payroll readiness verification remains outside this Admin page." },
    ],
    emptyActivityMessage: "No unified attendance activity is recorded yet.",
    emptyIssueMessage: "No unified attendance integration issues are recorded.",
  },
  payroll: {
    key: "payroll",
    title: "Payroll Integration",
    description: "Monitor the technical Payroll handoff and returned-result boundary without duplicating Payroll Staff workflows.",
    integrationKeys: ["payroll-handoff", "payroll-results"],
    sourceLabel: "Payroll handoff service and configured adapter",
    sourceDescription: "Payroll handoffs and returned results are read from the existing persisted services and adapter boundary.",
    technicalSummaryTitle: "Handoff and result status",
    technicalSummaryDescription: "This workspace exposes transfer mode, health, pending work, failures, and technical activity. It does not calculate salary or edit payroll records.",
    futureWorkflow: {
      title: "Payroll technical boundary",
      description: "Payroll Staff owns batch preparation and submission workflows. The Admin view remains limited to integration configuration and technical observability.",
      status: "Read-only monitoring",
    },
    capabilities: [
      { label: "Integration mode", detail: "The current configured adapter mode is shown from the server boundary." },
      { label: "Handoff status", detail: "Persisted handoff and acknowledgement states remain visible." },
      { label: "Returned results", detail: "Persisted Payroll result status and technical failures are summarized." },
      { label: "Payroll calculations", detail: "No salary, deduction, or payroll calculation is performed here." },
    ],
    emptyActivityMessage: "No Payroll integration activity is recorded yet.",
    emptyIssueMessage: "No Payroll integration issues are recorded.",
  },
  accounting: {
    key: "accounting",
    title: "Accounting Integration",
    description: "Monitor technical Payroll-to-Accounting transfers and acknowledgements without duplicating the Accounting workspace.",
    integrationKeys: ["accounting"],
    sourceLabel: "Accounting transfer service and configured adapter",
    sourceDescription: "Accounting transfers and acknowledgements are read from the existing persisted transfer service and adapter boundary.",
    technicalSummaryTitle: "Transfer and acknowledgement status",
    technicalSummaryDescription: "This workspace exposes configured mode, transfer health, pending work, failures, and technical activity. It does not create journals or post ledger entries.",
    futureWorkflow: {
      title: "Accounting technical boundary",
      description: "Accounting Staff owns approved Payroll review and transfer workflows. The Admin view remains limited to integration observability.",
      status: "Read-only monitoring",
    },
    capabilities: [
      { label: "Integration mode", detail: "The current configured adapter mode is shown from the server boundary." },
      { label: "Transfer status", detail: "Persisted transfer and acknowledgement states remain visible." },
      { label: "Technical failures", detail: "Rejected or failed transfer evidence is summarized from persisted records." },
      { label: "Accounting ERP", detail: "No journal, debit, credit, or General Ledger functionality is added here." },
    ],
    emptyActivityMessage: "No Accounting transfer activity is recorded yet.",
    emptyIssueMessage: "No Accounting integration issues are recorded.",
  },
} satisfies Record<string, AdminIntegrationDetailConfig>;

export function AdminIntegrationDetailPage({
  config,
  initialData,
  loadError: initialLoadError,
}: {
  config: AdminIntegrationDetailConfig;
  initialData: AdminIntegrationMonitoringData | null;
  loadError: boolean;
}) {
  const resolvedConfig = config ?? adminIntegrationDetailConfigs.unified;
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(
    initialLoadError ? `${resolvedConfig.title} data could not be loaded.` : null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      const response = await apiRequest<MonitoringApiResponse>(
        "/api/admin/integration-monitoring",
        { cache: "no-store" },
      );
      setData(response.data);
      setError(null);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : `${resolvedConfig.title} data could not be loaded.`,
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [resolvedConfig.title, isRefreshing]);

  const statuses = useMemo(
    () => data?.integrations.filter((integration) => resolvedConfig.integrationKeys.includes(integration.key)) ?? [],
    [resolvedConfig.integrationKeys, data],
  );
  const activities = useMemo(
    () => data?.activities.filter((activity) => resolvedConfig.integrationKeys.includes(activity.integrationKey)) ?? [],
    [resolvedConfig.integrationKeys, data],
  );
  const issues = useMemo(
    () => data?.issues.filter((issue) => resolvedConfig.integrationKeys.includes(issue.integrationKey)) ?? [],
    [resolvedConfig.integrationKeys, data],
  );

  return (
    <div
      className={`admin-page admin-integration-detail-page${isRefreshing ? " is-loading" : ""}`}
      aria-busy={isRefreshing}
    >
      <AdminPageHeader
        eyebrow="Integration control"
        title={resolvedConfig.title}
        description={resolvedConfig.description}
        actions={(
          <>
            <ActionButton
              icon="refresh"
              action={`${resolvedConfig.title} data refreshed.`}
              onAction={() => void refreshData()}
            >
              Refresh data
            </ActionButton>
            <Link className="button-secondary" href="/admin/integration-monitoring">
              Open monitoring
            </Link>
          </>
        )}
      />

      {error ? (
        <div className="notice" role="alert">
          <Icon name="warning" />
          <p>{data ? `${error} Showing the last successful data.` : `${error} Use Refresh data to try again.`}</p>
          <button type="button" className="button-link" onClick={() => void refreshData()}>
            Try again
          </button>
        </div>
      ) : null}

      <div className="metric-grid admin-five-card-metrics admin-integration-detail-metrics">
        {getSummaryMetrics(data, statuses).map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </div>

      {data && statuses.length === 0 ? (
        <div className="notice" role="status">
          <Icon name="info" />
          <p>No integration read-model entry is available for this workspace.</p>
        </div>
      ) : null}

      <div className="two-column admin-integration-detail-top-grid">
        <SectionCard title="Integration overview" eyebrow="Current technical state">
          <div className="panel-body integration-detail-status-grid">
            {statuses.length ? statuses.map((status) => (
              <IntegrationStatusCard key={status.key} status={status} />
            )) : (
              <p className="empty-state">Integration status is unavailable until data loads.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Source and configuration" eyebrow="Server-owned boundary">
          <div className="panel-body">
            <dl className="integration-detail-list">
              <div>
                <dt>Source boundary</dt>
                <dd>{resolvedConfig.sourceLabel}</dd>
              </div>
              <div>
                <dt>Provider</dt>
                <dd>{data && statuses.length ? getProviders(statuses) : "Unavailable"}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>{data && statuses.length ? getModeLabel(getGroupMode(statuses)) : "Unavailable"}</dd>
              </div>
              <div>
                <dt>Last successful activity</dt>
                <dd>{data && statuses.length ? formatTimestamp(getLatestSuccess(statuses)) : "Unavailable"}</dd>
              </div>
            </dl>
            <p className="integration-detail-description">{resolvedConfig.sourceDescription}</p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title={resolvedConfig.technicalSummaryTitle} eyebrow="Technical responsibilities">
        <div className="panel-body">
          <p className="integration-detail-description">{resolvedConfig.technicalSummaryDescription}</p>
          <div className="integration-detail-capability-grid">
            {resolvedConfig.capabilities.map((capability) => (
              <div className="integration-detail-capability" key={capability.label}>
                <strong>{capability.label}</strong>
                <p>{capability.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title={resolvedConfig.futureWorkflow.title} eyebrow="Scope boundary">
        <div className="panel-body">
          <div className="integration-detail-scope">
            <div>
              <strong>{resolvedConfig.futureWorkflow.title}</strong>
              <p>{resolvedConfig.futureWorkflow.description}</p>
            </div>
            <StatusBadge tone="muted">{resolvedConfig.futureWorkflow.status}</StatusBadge>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Recent technical activity" eyebrow="Persisted operational records">
        <div className="table-wrap">
          <table className="data-table integration-detail-activity-table">
            <caption className="sr-only">Recent technical activity for {resolvedConfig.title}</caption>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Activity</th>
                <th scope="col">Reference</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => <ActivityRow activity={activity} key={activity.id} />)}
            </tbody>
          </table>
          {!activities.length ? <p className="empty-state">{resolvedConfig.emptyActivityMessage}</p> : null}
        </div>
      </SectionCard>

      <SectionCard title="Technical issues" eyebrow="Persisted records requiring attention">
        <div className="panel-body issue-list">
          {issues.length ? issues.map((issue) => <IssueCard issue={issue} key={issue.id} />) : (
            <p className="empty-state">{resolvedConfig.emptyIssueMessage}</p>
          )}
        </div>
      </SectionCard>

      {data ? (
        <p className="page-feedback">
          <Icon name="info" /> Current values are read from the persisted integration read model.
        </p>
      ) : null}
    </div>
  );
}

function IntegrationStatusCard({ status }: { status: AdminIntegrationStatus }) {
  return (
    <article className={`integration-detail-status-card is-${status.health}`}>
      <div className="integration-detail-status-heading">
        <div className="integration-detail-status-title">
          <Icon name={status.icon} />
          <strong>{status.name}</strong>
        </div>
        <StatusBadge tone={getHealthTone(status.health)}>{getHealthLabel(status.health)}</StatusBadge>
      </div>
      <p>{status.detail}</p>
      <div className="integration-detail-status-meta">
        <span>Mode: {getModeLabel(status.mode)}</span>
        <span>Provider: {status.provider ?? "Not configured"}</span>
        <span>Pending: {status.pendingCount} · Issues: {status.issueCount}</span>
        <span>Last success: {formatTimestamp(status.lastSuccessfulAt)}</span>
      </div>
    </article>
  );
}

function ActivityRow({ activity }: { activity: AdminIntegrationActivity }) {
  return (
    <tr>
      <td>{formatTimestamp(activity.occurredAt)}</td>
      <td>{activity.summary}</td>
      <td>{activity.reference ?? "—"}</td>
      <td><StatusBadge tone={getActivityTone(activity.status)}>{activity.status}</StatusBadge></td>
    </tr>
  );
}

function IssueCard({ issue }: { issue: AdminIntegrationIssue }) {
  return (
    <article className={`issue-card ${issue.severity === "critical" || issue.severity === "error" ? "danger" : "warning"}`}>
      <div>
        <div className="integration-detail-issue-heading">
          <h3>{issue.summary}</h3>
          <StatusBadge tone={issue.severity === "critical" || issue.severity === "error" ? "danger" : "warning"}>
            {issue.severity}
          </StatusBadge>
        </div>
        <p>{issue.affectedRecordType ?? "Record"}: {issue.affectedRecordId ?? "—"}</p>
        <small>{issue.reference ? `Reference: ${issue.reference} · ` : ""}Detected: {formatTimestamp(issue.detectedAt)}</small>
      </div>
      {issue.detailHref ? <Link className="button-link" href={issue.detailHref}>View monitoring</Link> : null}
    </article>
  );
}

function getSummaryMetrics(
  data: AdminIntegrationMonitoringData | null,
  statuses: readonly AdminIntegrationStatus[],
): Metric[] {
  if (!data || statuses.length === 0) {
    return [
      { label: "Integration mode", value: "—", note: "Unavailable", icon: "settings", tone: "info" },
      { label: "Health", value: "—", note: "Unavailable", icon: "monitoring", tone: "info" },
      { label: "Pending operations", value: "—", note: "Unavailable", icon: "clock", tone: "warning" },
      { label: "Technical issues", value: "—", note: "Unavailable", icon: "warning", tone: "danger" },
      { label: "Last success", value: "—", note: "Unavailable", icon: "calendar", tone: "info" },
    ];
  }

  const health = getGroupHealth(statuses);
  const pending = statuses.reduce((total, status) => total + status.pendingCount, 0);
  const issues = statuses.reduce((total, status) => total + status.issueCount, 0);

  return [
    { label: "Integration mode", value: getModeLabel(getGroupMode(statuses)), note: getProviders(statuses), icon: "settings", tone: "info" },
    { label: "Health", value: getHealthLabel(health), note: "Current persisted technical state", icon: "monitoring", tone: getHealthTone(health) },
    { label: "Pending operations", value: String(pending), note: pending ? "Awaiting completion or acknowledgement" : "No pending operations recorded", icon: "clock", tone: pending ? "warning" : "success" },
    { label: "Technical issues", value: String(issues), note: issues ? "Technical follow-up required" : "No persisted failures", icon: "warning", tone: issues ? "danger" : "success" },
    { label: "Last success", value: formatTimestamp(getLatestSuccess(statuses)), note: "Latest successful operation", icon: "calendar", tone: "info" },
  ];
}

function getGroupHealth(statuses: readonly AdminIntegrationStatus[]): AdminIntegrationHealth {
  const priority: AdminIntegrationHealth[] = ["failed", "degraded", "pending", "unknown", "not_configured", "healthy"];
  return priority.find((health) => statuses.some((status) => status.health === health)) ?? "unknown";
}

function getGroupMode(statuses: readonly AdminIntegrationStatus[]): string {
  const modes = [...new Set(statuses.map((status) => status.mode))];
  return modes.length === 1 ? modes[0] : modes.length > 1 ? "mixed" : "not_configured";
}

function getProviders(statuses: readonly AdminIntegrationStatus[]) {
  const providers = [...new Set(statuses.map((status) => status.provider).filter(Boolean))];
  return providers.length ? providers.join(" / ") : "Not configured";
}

function getLatestSuccess(statuses: readonly AdminIntegrationStatus[]) {
  return statuses
    .map((status) => status.lastSuccessfulAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0] ?? null;
}

function getHealthTone(health: AdminIntegrationHealth): StatusTone {
  if (health === "healthy") return "success";
  if (health === "failed") return "danger";
  if (health === "pending" || health === "degraded") return "warning";
  if (health === "unknown") return "info";
  return "muted";
}

function getHealthLabel(health: AdminIntegrationHealth) {
  if (health === "not_configured") return "Not Configured";
  if (health === "unknown") return "Unknown";
  return health.charAt(0).toUpperCase() + health.slice(1);
}

function getModeLabel(mode: string | AdminIntegrationMode) {
  if (mode === "not_configured") return "Not Configured";
  if (mode === "mixed") return "Mixed";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function getActivityTone(status: AdminIntegrationActivity["status"]): StatusTone {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  if (status === "pending") return "warning";
  return "info";
}

function formatTimestamp(value: string | null) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}
