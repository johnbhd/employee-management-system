import "server-only";

import { applicationRoleDefinitions } from "@/lib/auth/permissions";
import { getAdminAuditLogsData } from "@/server/admin/admin-audit-logs.service";
import { getAdminIntegrationMonitoringData } from "@/server/admin/integration-monitoring.service";
import { getAdminSettingsData } from "@/server/admin/admin-settings.service";
import { getAdminUserAccountSummary } from "@/server/admin/admin-user-account.service";
import { getRolesPermissionsData } from "@/server/admin/roles-permissions.service";
import type { AdminDashboardAlert, AdminDashboardData } from "@/types/admin-dashboard";
import type { AdminIntegrationIssue } from "@/types/admin-integration-monitoring";

function alertSeverity(issue: AdminIntegrationIssue): AdminDashboardAlert["severity"] {
  if (issue.severity === "critical") return "critical";
  if (issue.severity === "error") return "error";
  return "warning";
}

function buildAlerts(input: {
  issues: readonly AdminIntegrationIssue[];
  accountIssues: number;
  rbacIssues: readonly string[];
  notConfigured: readonly string[];
}): AdminDashboardAlert[] {
  const alerts: AdminDashboardAlert[] = input.issues.map((issue) => ({
    id: `integration:${issue.id}`,
    severity: alertSeverity(issue),
    title: `${issue.integrationName} requires attention`,
    message: issue.summary,
    href: issue.detailHref ?? "/admin/integration-monitoring",
    source: "integration",
  }));

  if (input.accountIssues > 0) {
    alerts.push({
      id: "accounts:integrity",
      severity: "warning",
      title: "Account integrity needs review",
      message: `${input.accountIssues} application account${input.accountIssues === 1 ? " has" : "s have"} a missing profile or invalid employee link.`,
      href: "/admin/user-accounts",
      source: "account",
    });
  }

  for (const issue of input.rbacIssues) {
    alerts.push({
      id: `rbac:${issue}`,
      severity: "critical",
      title: "RBAC configuration needs attention",
      message: issue,
      href: "/admin/roles-permissions",
      source: "rbac",
    });
  }

  if (input.notConfigured.length > 0) {
    alerts.push({
      id: "configuration:not-configured",
      severity: "warning",
      title: "Integration configuration is incomplete",
      message: `${input.notConfigured.join(", ")} ${input.notConfigured.length === 1 ? "is" : "are"} not configured.`,
      href: "/admin/settings",
      source: "configuration",
    });
  }

  const severityRank: Record<AdminDashboardAlert["severity"], number> = {
    critical: 0,
    error: 1,
    warning: 2,
    info: 3,
  };

  return alerts
    .sort((left, right) => severityRank[left.severity] - severityRank[right.severity] || left.id.localeCompare(right.id))
    .slice(0, 8);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [monitoring, accounts, rolesPermissions, settings, auditLogs] = await Promise.all([
    getAdminIntegrationMonitoringData(),
    getAdminUserAccountSummary(),
    getRolesPermissionsData(),
    getAdminSettingsData(),
    getAdminAuditLogsData({
      search: "",
      from: null,
      to: null,
      role: null,
      module: null,
      action: null,
      outcome: null,
      page: 1,
      pageSize: 5,
    }),
  ]);

  const roleNames = new Map(
    applicationRoleDefinitions.map((role) => [role.id, role.label]),
  );
  const successful = monitoring.activities.filter((activity) => activity.status === "success").length;
  const pending = monitoring.activities.filter((activity) => activity.status === "pending").length;
  const failed = monitoring.activities.filter((activity) => activity.status === "failed").length;
  const notConfigured = settings.integrations
    .filter((integration) => integration.mode === "not_configured")
    .map((integration) => integration.name);

  const configurationIntegrations = settings.integrations.map((integration) => ({
    key: integration.key,
    name: integration.name,
    mode: integration.mode,
    status: integration.status,
    detail: integration.detail,
    monitoringHref: integration.monitoringHref,
  }));

  return {
    summary: {
      overallHealth: monitoring.summary.overallHealth,
      configuredIntegrations: monitoring.summary.configuredIntegrations,
      healthyIntegrations: monitoring.summary.healthyIntegrations,
      pendingOperations: monitoring.summary.pendingOperations,
      integrationIssues: monitoring.summary.integrationIssues,
      totalAccounts: accounts.total,
      activeAccounts: accounts.active,
      disabledAccounts: accounts.disabled,
      accountIssues: accounts.integrityIssues,
    },
    integrations: monitoring.integrations,
    activities: monitoring.activities,
    flow: monitoring.flow,
    synchronization: {
      successful,
      pending,
      failed,
      total: successful + pending + failed,
    },
    accounts: {
      total: accounts.total,
      active: accounts.active,
      disabled: accounts.disabled,
      integrityIssues: accounts.integrityIssues,
      roles: accounts.roleCounts.map((role) => ({
        roleId: role.roleId,
        roleName: roleNames.get(role.roleId) ?? role.roleId,
        memberCount: role.memberCount,
      })),
    },
    rolesPermissions: rolesPermissions.summary,
    configuration: {
      environment: settings.systemInfo.environment,
      version: settings.systemInfo.version,
      campus: settings.systemInfo.campus,
      timezone: settings.systemInfo.timezone,
      settingsUpdatedAt: settings.updatedAt,
      integrations: configurationIntegrations,
    },
    recentActivity: auditLogs.events,
    issues: monitoring.issues,
    alerts: buildAlerts({
      issues: monitoring.issues,
      accountIssues: accounts.integrityIssues,
      rbacIssues: rolesPermissions.summary.configurationIssues,
      notConfigured,
    }),
    generatedAt: new Date().toISOString(),
  };
}
