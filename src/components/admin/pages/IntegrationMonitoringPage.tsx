"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
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
  AdminIntegrationStatus,
} from "@/types/admin-integration-monitoring";
import type { Metric, StatusTone } from "@/types/ui";

type MonitoringApiResponse = ApiSuccessResponse<AdminIntegrationMonitoringData>;

export function IntegrationMonitoringPage({
  initialData,
  loadError: initialLoadError,
}: {
  initialData: AdminIntegrationMonitoringData | null;
  loadError: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(
    initialLoadError ? "Integration monitoring data could not be loaded." : null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const refreshData = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      const response = await apiRequest<MonitoringApiResponse>(
        "/api/v1/admin/integration-monitoring",
        { cache: "no-store" },
      );
      setData(response.data);
      setError(null);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Integration monitoring data could not be loaded.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const filteredActivities = useMemo(() => {
    if (!data) return [];

    const normalizedSearch = search.trim().toLowerCase();

    return data.activities.filter((activity) => {
      const matchesSearch = !normalizedSearch || [
        activity.integrationName,
        activity.summary,
        activity.reference,
      ].some((value) => value?.toLowerCase().includes(normalizedSearch));
      const matchesStatus = statusFilter === "all" || activity.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const summaryMetrics = getSummaryMetrics(data);

  return (
    <div
      className={`admin-page monitoring-page${isRefreshing ? " is-loading" : ""}`}
      aria-busy={isRefreshing}
    >
      <AdminPageHeader
        eyebrow="Operations"
        title="Integration Monitoring"
        description="Observe real integration health, pending work, and technical failures across the employee management system."
        actions={(
          <ActionButton
            icon="refresh"
            action="Integration monitoring data refreshed."
            onAction={() => void refreshData()}
          >
            Refresh monitoring
          </ActionButton>
        )}
      />

      {error ? (
        <div className="monitoring-load-error" role="alert">
          <Icon name="warning" />
          <span>
            {data
              ? `${error} Showing the last successful monitoring data.`
              : `${error} Use Refresh monitoring to try again.`}
          </span>
          <button type="button" className="button-link" onClick={() => void refreshData()}>
            Try again
          </button>
        </div>
      ) : null}

      <div className="metric-grid monitoring-metrics">
        {summaryMetrics.map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </div>

      <SectionCard title="Connected systems" eyebrow="Current health">
        {data ? (
          <div className="panel-body monitoring-system-grid">
            {data.integrations.map((integration) => (
              <IntegrationStatusCard integration={integration} key={integration.key} />
            ))}
          </div>
        ) : (
          <p className="empty-state">Integration health is unavailable until the monitoring data loads.</p>
        )}
      </SectionCard>

      <SectionCard title="Data flow" eyebrow="End-to-end path">
        {data ? (
          <FlowDiagram nodes={data.flow} />
        ) : (
          <p className="empty-state">The integration flow is unavailable.</p>
        )}
      </SectionCard>

      <SectionCard title="Synchronization activity" eyebrow="Real persisted activity">
        {data ? (
          <>
            <div className="filter-toolbar monitoring-filter-toolbar">
              <label className="field">
                <span>Search activity</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search integration or reference"
                />
              </label>
              <label className="field">
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="info">Information</option>
                </select>
              </label>
            </div>
            <div className="table-wrap">
              <table className="data-table monitoring-activity-table">
                <caption className="sr-only">Persisted integration activity</caption>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Integration</th>
                    <th>Activity</th>
                    <th>Reference</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity) => (
                    <ActivityRow activity={activity} key={activity.id} />
                  ))}
                </tbody>
              </table>
              {filteredActivities.length === 0 ? (
                <p className="empty-state">No persisted integration activity matches these filters.</p>
              ) : null}
            </div>
          </>
        ) : (
          <p className="empty-state">Activity is unavailable until the monitoring data loads.</p>
        )}
      </SectionCard>

      <div className="two-column monitoring-lower-grid">
        <SectionCard title="Technical issues" eyebrow="Open records requiring attention">
          <div className="panel-body issue-list">
            {data?.issues.length ? (
              data.issues.map((issue) => <IntegrationIssueCard issue={issue} key={issue.id} />)
            ) : (
              <p className="empty-state">No persisted technical integration failures require attention.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Monitoring boundary" eyebrow="Interpretation">
          <div className="panel-body monitoring-boundary-list">
            <div className="monitoring-boundary-item">
              <Icon name="check" />
              <div>
                <strong>Healthy</strong>
                <p>Configured integrations with evidence of a successful operation and no unresolved technical failure.</p>
              </div>
            </div>
            <div className="monitoring-boundary-item">
              <Icon name="clock" />
              <div>
                <strong>Pending is not failed</strong>
                <p>Awaiting acknowledgement and processing work remain visible without being counted as failures.</p>
              </div>
            </div>
            <div className="monitoring-boundary-item">
              <Icon name="shield" />
              <div>
                <strong>Technical visibility only</strong>
                <p>{data?.providerNote ?? "Provider and adapter information is unavailable."}</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <p className="page-feedback">
        <Icon name="info" />
        Monitoring values come from persisted operational records and configured adapter boundaries.
      </p>
    </div>
  );
}

function IntegrationStatusCard({ integration }: { integration: AdminIntegrationStatus }) {
  return (
    <article className={`system-health-card monitoring-system-card is-${integration.health}`}>
      <div className="system-health-heading">
        <div className="monitoring-system-title">
          <Icon name={integration.icon} />
          <strong>{integration.name}</strong>
        </div>
        <StatusBadge tone={getHealthTone(integration.health)}>
          {getHealthLabel(integration.health)}
        </StatusBadge>
      </div>
      <p>{integration.detail}</p>
      <div className="monitoring-system-meta">
        <span>Mode: {getModeLabel(integration.mode)}</span>
        <span>Provider: {integration.provider ?? "Not configured"}</span>
        <span>Pending: {integration.pendingCount} · Issues: {integration.issueCount}</span>
        <span>Last success: {formatTimestamp(integration.lastSuccessfulAt)}</span>
        <span>Last failure: {formatTimestamp(integration.lastFailureAt)}</span>
      </div>
      {integration.detailHref ? (
        <Link className="button-link monitoring-detail-link" href={integration.detailHref}>
          View source details
          <Icon name="arrow" />
        </Link>
      ) : null}
    </article>
  );
}

function IntegrationIssueCard({ issue }: { issue: AdminIntegrationIssue }) {
  return (
    <article className={`issue-card ${getIssueTone(issue.severity)}`}>
      <div className="monitoring-issue-copy">
        <div className="monitoring-issue-heading">
          <h3>{issue.integrationName}</h3>
          <StatusBadge tone={getIssueTone(issue.severity)}>
            {issue.severity}
          </StatusBadge>
        </div>
        <p>{issue.summary}</p>
        <small>
          {issue.affectedRecordType ?? "Record"}: {issue.affectedRecordId ?? "—"}
          {issue.reference ? ` · Reference: ${issue.reference}` : ""}
          {` · Detected: ${formatTimestamp(issue.detectedAt)}`}
        </small>
      </div>
      {issue.detailHref ? (
        <Link className="button-link" href={issue.detailHref}>
          View details
        </Link>
      ) : null}
    </article>
  );
}

function ActivityRow({ activity }: { activity: AdminIntegrationActivity }) {
  return (
    <tr>
      <td>{formatTimestamp(activity.occurredAt)}</td>
      <td>{activity.integrationName}</td>
      <td>{activity.summary}</td>
      <td>{activity.reference ?? "—"}</td>
      <td>
        <StatusBadge tone={getActivityTone(activity.status)}>
          {activity.status}
        </StatusBadge>
      </td>
    </tr>
  );
}

function getSummaryMetrics(data: AdminIntegrationMonitoringData | null): Metric[] {
  if (!data) {
    return [
      { label: "Configured integrations", value: "—", note: "Unavailable", icon: "monitoring", tone: "info" },
      { label: "Healthy integrations", value: "—", note: "Unavailable", icon: "check", tone: "success" },
      { label: "Pending operations", value: "—", note: "Unavailable", icon: "clock", tone: "warning" },
      { label: "Integration issues", value: "—", note: "Unavailable", icon: "warning", tone: "danger" },
    ];
  }

  return [
    {
      label: "Configured integrations",
      value: String(data.summary.configuredIntegrations),
      note: `${getHealthLabel(data.summary.overallHealth)} overall health`,
      icon: "monitoring",
      tone: "info",
    },
    {
      label: "Healthy integrations",
      value: String(data.summary.healthyIntegrations),
      note: "Configured sources with success evidence",
      icon: "check",
      tone: "success",
    },
    {
      label: "Pending operations",
      value: String(data.summary.pendingOperations),
      note: "Awaiting processing or acknowledgement",
      icon: "clock",
      tone: "warning",
    },
    {
      label: "Integration issues",
      value: String(data.summary.integrationIssues),
      note: data.summary.integrationIssues > 0 ? "Technical follow-up required" : "No persisted failures",
      icon: "warning",
      tone: "danger",
    },
  ];
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

function getModeLabel(mode: AdminIntegrationStatus["mode"]) {
  if (mode === "not_configured") return "Not Configured";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function getIssueTone(severity: AdminIntegrationIssue["severity"]): StatusTone {
  return severity === "critical" || severity === "error" ? "danger" : "warning";
}

function getActivityTone(status: AdminIntegrationActivity["status"]): StatusTone {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  if (status === "pending") return "warning";
  return "info";
}

function formatTimestamp(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}
