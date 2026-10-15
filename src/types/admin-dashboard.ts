import type { AdminAuditLog } from "@/types/admin-audit-logs";
import type {
  AdminIntegrationFlowNode,
  AdminIntegrationHealth,
  AdminIntegrationIssue,
  AdminIntegrationActivity,
  AdminIntegrationStatus,
} from "@/types/admin-integration-monitoring";

export type AdminDashboardAlert = {
  id: string;
  severity: "info" | "warning" | "error" | "critical";
  title: string;
  message: string;
  href: string | null;
  source: "integration" | "account" | "rbac" | "configuration";
};

export type AdminDashboardRoleSummary = {
  roleId: string;
  roleName: string;
  memberCount: number;
};

export type AdminDashboardConfigurationIntegration = {
  key: string;
  name: string;
  mode: string;
  status: string;
  detail: string;
  monitoringHref: string;
};

export type AdminDashboardData = {
  summary: {
    overallHealth: AdminIntegrationHealth;
    configuredIntegrations: number;
    healthyIntegrations: number;
    pendingOperations: number;
    integrationIssues: number;
    totalAccounts: number;
    activeAccounts: number;
    disabledAccounts: number;
    accountIssues: number;
  };
  integrations: AdminIntegrationStatus[];
  activities: AdminIntegrationActivity[];
  flow: AdminIntegrationFlowNode[];
  synchronization: {
    successful: number;
    pending: number;
    failed: number;
    total: number;
  };
  accounts: {
    total: number;
    active: number;
    disabled: number;
    integrityIssues: number;
    roles: AdminDashboardRoleSummary[];
  };
  rolesPermissions: {
    roleCount: number;
    permissionCount: number;
    assignedPermissionCount: number;
    configurationStatus: "healthy" | "attention";
    configurationIssues: string[];
    latestUpdatedAt: string | null;
  };
  configuration: {
    environment: string;
    version: string;
    campus: string;
    timezone: string;
    settingsUpdatedAt: string | null;
    integrations: AdminDashboardConfigurationIntegration[];
  };
  recentActivity: AdminAuditLog[];
  issues: AdminIntegrationIssue[];
  alerts: AdminDashboardAlert[];
  generatedAt: string;
};
