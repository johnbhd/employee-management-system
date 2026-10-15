"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type {
  AdminDashboardAlert,
  AdminDashboardData,
} from "@/types/admin-dashboard";
import type {
  AdminIntegrationActivity,
  AdminIntegrationHealth,
  AdminIntegrationStatus,
} from "@/types/admin-integration-monitoring";
import type { Metric, StatusTone } from "@/types/ui";

type DashboardApiResponse = ApiSuccessResponse<AdminDashboardData>;

export function AdminDashboardPage({
  initialData,
  loadError: initialLoadError,
}: {
  initialData: AdminDashboardData | null;
  loadError: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [loadError, setLoadError] = useState(initialLoadError);
  const [feedback, setFeedback] = useState(
    initialLoadError ? "Admin dashboard data could not be loaded." : "",
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      const response = await apiRequest<DashboardApiResponse>(
        "/api/admin/dashboard",
        { cache: "no-store" },
      );
      setData(response.data);
      setLoadError(false);
      setFeedback("Dashboard data refreshed.");
    } catch (error) {
      setLoadError(true);
      setFeedback(
        error instanceof Error
          ? error.message
          : "Admin dashboard data could not be loaded.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  return (
    <div
      className={`admin-page admin-dashboard-page${isRefreshing ? " is-loading" : ""}`}
      aria-busy={isRefreshing}
    >
      <AdminPageHeader
        eyebrow="Integration control center"
        title="IT Administrator Dashboard"
        description="Monitor the employee data boundary, attendance sources, and downstream integration readiness from one workspace."
        actions={(
          <>
            <ActionButton
              icon="refresh"
              action="Dashboard data refreshed."
              onAction={() => void refreshData()}
            >
              {isRefreshing ? "Refreshing…" : "Refresh data"}
            </ActionButton>
            <Link className="button-primary" href="/admin/integration-monitoring">
              Open monitoring
            </Link>
          </>
        )}
      />

      {loadError ? (
        <div className="notice" role="alert">
          <Icon name="warning" />
          <p>
            {data
              ? `${feedback} Showing the last successful dashboard data.`
              : `${feedback} Use Refresh data to try again.`}
          </p>
          <button type="button" className="button-link" onClick={() => void refreshData()}>
            Try again
          </button>
        </div>
      ) : null}

      <div className="metric-grid">
        {getSummaryMetrics(data).map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="two-column">
        <SectionCard title="Integration health" eyebrow="Connected systems">
          <div className="panel-body list-stack">
            {data?.integrations.length ? data.integrations.map((system) => (
              <IntegrationHealthRow key={system.key} system={system} />
            )) : (
              <p className="empty-state">
                Integration health is unavailable until dashboard data loads.
              </p>
            )}
          </div>
        </SectionCard>
        <SectionCard title="Synchronization overview" eyebrow="Persisted activity snapshot">
          <div className="panel-body">
            {data ? (
              <ProgressList items={getSynchronizationItems(data)} />
            ) : (
              <p className="empty-state">Synchronization activity is unavailable.</p>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Attendance data flow" eyebrow="Source to standardized layer">
        {data ? (
          <FlowDiagram nodes={data.flow} />
        ) : (
          <p className="empty-state">The integration flow is unavailable.</p>
        )}
        <p className="data-flow-note">
          HRPS remains the employee information source of truth. Bundy and QR records are
          standardized before verified attendance is sent to downstream systems.
        </p>
      </SectionCard>

      <SectionCard
        title="Recent integration events"
        eyebrow="Latest persisted activity"
        actions={<Link className="button-link" href="/admin/integration-monitoring">View monitoring</Link>}
      >
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Recent integration events</caption>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Integration</th>
                <th scope="col">Activity</th>
                <th scope="col">Reference</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.activities.slice(0, 5).map((activity) => (
                <IntegrationActivityRow key={activity.id} activity={activity} />
              ))}
            </tbody>
          </table>
          {!data?.activities.length ? (
            <p className="empty-state">No persisted integration activity is available.</p>
          ) : null}
        </div>
      </SectionCard>

      <div className="two-column-wide">
        <SectionCard title="Technical alerts" eyebrow="Needs attention">
          <div className="panel-body issue-list">
            {data?.alerts.length ? data.alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            )) : (
              <p className="empty-state">
                No persisted technical or administrator alerts require attention.
              </p>
            )}
          </div>
        </SectionCard>
        <SectionCard title="Quick actions" eyebrow="Administration navigation">
          <div className="panel-body quick-action-grid">
            <Link className="quick-action-link" href="/admin/integration-monitoring">
              Integration Monitoring <Icon name="arrow" />
            </Link>
            <Link className="quick-action-link" href="/admin/user-accounts">
              User Accounts <Icon name="arrow" />
            </Link>
            <Link className="quick-action-link" href="/admin/roles-permissions">
              Roles &amp; Permissions <Icon name="arrow" />
            </Link>
            <Link className="quick-action-link" href="/admin/audit-logs">
              Audit Logs <Icon name="arrow" />
            </Link>
            <Link className="quick-action-link" href="/admin/settings">
              System &amp; Settings <Icon name="arrow" />
            </Link>
          </div>
        </SectionCard>
      </div>

      <div className="two-column">
        <SectionCard title="Application accounts" eyebrow="Firebase and application profile summary">
          {data ? (
            <div className="panel-body list-stack">
              <AccountSummaryRow
                label="Total accounts"
                detail="Application-managed Firebase identities."
                value={data.accounts.total}
              />
              <AccountSummaryRow
                label="Active accounts"
                detail="Enabled identities with active application profiles."
                value={data.accounts.active}
              />
              <AccountSummaryRow
                label="Disabled accounts"
                detail="Disabled by Firebase Authentication."
                value={data.accounts.disabled}
              />
              <div className="list-row">
                <div>
                  <strong>Integrity issues</strong>
                  <p>Missing profiles or invalid employee links.</p>
                </div>
                <StatusBadge tone={data.accounts.integrityIssues ? "warning" : "success"}>
                  {data.accounts.integrityIssues}
                </StatusBadge>
              </div>
              <ProgressList items={getRoleItems(data)} />
              <Link className="button-link" href="/admin/user-accounts">
                Review account details <Icon name="arrow" />
              </Link>
            </div>
          ) : (
            <p className="empty-state">Account summary is unavailable.</p>
          )}
        </SectionCard>
        <SectionCard title="RBAC and configuration" eyebrow="Controlled technical boundaries">
          {data ? (
            <div className="panel-body list-stack">
              <div className="list-row">
                <div>
                  <strong>Role configuration</strong>
                  <p>
                    {data.rolesPermissions.roleCount} controlled roles · {data.rolesPermissions.permissionCount} permissions.
                  </p>
                </div>
                <StatusBadge tone={data.rolesPermissions.configurationStatus === "healthy" ? "success" : "danger"}>
                  {data.rolesPermissions.configurationStatus === "healthy" ? "Healthy" : "Attention"}
                </StatusBadge>
              </div>
              <AccountSummaryRow
                label="Assigned permissions"
                detail="Current role assignments."
                value={data.rolesPermissions.assignedPermissionCount}
              />
              <div className="list-row">
                <div>
                  <strong>Environment</strong>
                  <p>{data.configuration.campus} · {data.configuration.timezone}</p>
                </div>
                <StatusBadge tone="info">{data.configuration.environment}</StatusBadge>
              </div>
              <AccountSummaryRow
                label="Application version"
                detail="Read-only build metadata."
                value={data.configuration.version}
              />
              <div className="list-row">
                <div>
                  <strong>Runtime settings</strong>
                  <p>Last saved override: {formatTimestamp(data.configuration.settingsUpdatedAt)}</p>
                </div>
                <StatusBadge tone="muted">Read-only view</StatusBadge>
              </div>
              {data.configuration.integrations.map((integration) => (
                <div className="list-row" key={integration.key}>
                  <div>
                    <strong>{integration.name}</strong>
                    <p>{integration.detail}</p>
                  </div>
                  <div className="connection-status">
                    <StatusBadge tone={getConfigurationTone(integration.mode)}>{integration.status}</StatusBadge>
                    <Link className="button-link" href={integration.monitoringHref}>
                      View integration
                    </Link>
                  </div>
                </div>
              ))}
              <Link className="button-link" href="/admin/settings">
                Review settings <Icon name="arrow" />
              </Link>
            </div>
          ) : (
            <p className="empty-state">RBAC and configuration data is unavailable.</p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Recent audit activity"
        eyebrow="Traceability"
        actions={(
          <Link className="button-link" href="/admin/audit-logs">
            View all audit logs
          </Link>
        )}
      >
        <div className="panel-body timeline-list">
          {data?.recentActivity.length ? data.recentActivity.map((event) => (
            <div className="timeline-item" key={event.id}>
              <div>
                <strong>{event.action}</strong>
                <p>
                  {event.actor.name} · {event.actor.role ?? event.actor.type} · {event.target.label}
                </p>
              </div>
              <small>{formatTimestamp(event.occurredAtTimestamp)}</small>
            </div>
          )) : (
            <p className="empty-state">No meaningful audit activity has been recorded.</p>
          )}
        </div>
      </SectionCard>

      {data ? (
        <p className="page-feedback">
          <Icon name="info" /> Updated {formatTimestamp(data.generatedAt)}.
        </p>
      ) : null}
    </div>
  );
}

function AccountSummaryRow({
  label,
  detail,
  value,
}: {
  label: string;
  detail: string;
  value: number | string;
}) {
  return (
    <div className="list-row">
      <div>
        <strong>{label}</strong>
        <p>{detail}</p>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function IntegrationHealthRow({ system }: { system: AdminIntegrationStatus }) {
  return (
    <div className="list-row">
      <div>
        <strong>{system.name}</strong>
        <p>{system.detail}</p>
        <small>
          Mode: {getModeLabel(system.mode)} · Pending: {system.pendingCount}
          {" · "}
          Issues: {system.issueCount}
          {" · "}
          Last success: {formatTimestamp(system.lastSuccessfulAt)}
        </small>
      </div>
      <div className="integration-health-actions">
        <StatusBadge tone={getHealthTone(system.health)}>{getHealthLabel(system.health)}</StatusBadge>
        {system.detailHref ? (
          <Link className="button-link" href={system.detailHref}>
            View details <Icon name="arrow" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function IntegrationActivityRow({ activity }: { activity: AdminIntegrationActivity }) {
  return (
    <tr>
      <td>{formatTimestamp(activity.occurredAt)}</td>
      <td>{activity.integrationName}</td>
      <td>{activity.summary}</td>
      <td>{activity.reference ?? "—"}</td>
      <td>
        <StatusBadge tone={getActivityTone(activity.status)}>{activity.status}</StatusBadge>
      </td>
    </tr>
  );
}

function AlertCard({ alert }: { alert: AdminDashboardAlert }) {
  return (
    <article className={`issue-card ${getAlertTone(alert.severity)}`}>
      <div>
        <h3>{alert.title}</h3>
        <p>{alert.message}</p>
        <small>Source: {alert.source}</small>
      </div>
      {alert.href ? (
        <Link className="button-link" href={alert.href}>
          Review <Icon name="arrow" />
        </Link>
      ) : null}
    </article>
  );
}

function getSummaryMetrics(data: AdminDashboardData | null): Metric[] {
  if (!data) {
    return [
      { label: "Configured integrations", value: "—", note: "Unavailable", icon: "monitoring", tone: "info" },
      { label: "Healthy integrations", value: "—", note: "Unavailable", icon: "check", tone: "success" },
      { label: "Pending operations", value: "—", note: "Unavailable", icon: "clock", tone: "warning" },
      { label: "Integration issues", value: "—", note: "Unavailable", icon: "warning", tone: "danger" },
      { label: "Total accounts", value: "—", note: "Unavailable", icon: "users", tone: "info" },
      { label: "Active accounts", value: "—", note: "Unavailable", icon: "users", tone: "success" },
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
      note: data.summary.integrationIssues ? "Technical follow-up required" : "No persisted failures",
      icon: "warning",
      tone: data.summary.integrationIssues ? "danger" : "success",
    },
    {
      label: "Total accounts",
      value: String(data.summary.totalAccounts),
      note: `${data.summary.disabledAccounts} disabled · ${data.summary.accountIssues} integrity issues`,
      icon: "users",
      tone: "info",
    },
    {
      label: "Active accounts",
      value: String(data.summary.activeAccounts),
      note: "Enabled identities with valid profiles",
      icon: "users",
      tone: "success",
    },
  ];
}

function getSynchronizationItems(data: AdminDashboardData) {
  const total = data.synchronization.total;
  return [
    {
      label: "Successful activity",
      value: `${data.synchronization.successful} records`,
      percent: percentage(data.synchronization.successful, total),
      tone: "success" as const,
    },
    {
      label: "Pending activity",
      value: `${data.synchronization.pending} records`,
      percent: percentage(data.synchronization.pending, total),
      tone: "warning" as const,
    },
    {
      label: "Failed activity",
      value: `${data.synchronization.failed} records`,
      percent: percentage(data.synchronization.failed, total),
      tone: "warning" as const,
    },
  ];
}

function getRoleItems(data: AdminDashboardData) {
  return data.accounts.roles.map((role) => ({
    label: role.roleName,
    value: `${role.memberCount} ${role.memberCount === 1 ? "user" : "users"}`,
    percent: percentage(role.memberCount, data.accounts.total),
    tone: "default" as const,
  }));
}

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
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

function getActivityTone(status: AdminIntegrationActivity["status"]): StatusTone {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  if (status === "pending") return "warning";
  return "info";
}

function getAlertTone(severity: AdminDashboardAlert["severity"]): StatusTone {
  if (severity === "critical" || severity === "error") return "danger";
  return "warning";
}

function getConfigurationTone(mode: string): StatusTone {
  if (mode === "not_configured") return "warning";
  if (mode === "simulated") return "info";
  return "success";
}

function formatTimestamp(value: string | number | null) {
  if (value === null || value === "") return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}
