import type { IconName, StatusTone } from "@/types/ui";

export const adminIntegrationHealthStatuses = [
  "healthy",
  "degraded",
  "failed",
  "pending",
  "not_configured",
  "unknown",
] as const;

export type AdminIntegrationHealth =
  (typeof adminIntegrationHealthStatuses)[number];

export const adminIntegrationModes = [
  "real",
  "simulated",
  "local",
  "not_configured",
] as const;

export type AdminIntegrationMode = (typeof adminIntegrationModes)[number];

export type AdminIntegrationCategory =
  | "employee-data"
  | "attendance"
  | "payroll"
  | "accounting";

export type AdminIntegrationStatus = {
  key: string;
  name: string;
  category: AdminIntegrationCategory;
  icon: IconName;
  health: AdminIntegrationHealth;
  mode: AdminIntegrationMode;
  provider: string | null;
  detail: string;
  pendingCount: number;
  issueCount: number;
  lastSuccessfulAt: string | null;
  lastFailureAt: string | null;
  detailHref: string | null;
};

export type AdminIntegrationIssue = {
  id: string;
  integrationKey: string;
  integrationName: string;
  affectedRecordType: string | null;
  affectedRecordId: string | null;
  reference: string | null;
  severity: "info" | "warning" | "error" | "critical";
  status: "open" | "retrying" | "resolved";
  summary: string;
  detectedAt: string;
  lastAttemptAt: string | null;
  retrySupported: boolean;
  detailHref: string | null;
};

export type AdminIntegrationActivity = {
  id: string;
  integrationKey: string;
  integrationName: string;
  summary: string;
  reference: string | null;
  status: "success" | "pending" | "failed" | "info";
  occurredAt: string;
};

export type AdminIntegrationFlowNode = {
  key: string;
  label: string;
  detail: string;
  icon: IconName;
  status: string;
  tone: StatusTone;
};

export type AdminIntegrationMonitoringData = {
  summary: {
    configuredIntegrations: number;
    healthyIntegrations: number;
    pendingOperations: number;
    integrationIssues: number;
    overallHealth: AdminIntegrationHealth;
    lastSuccessfulAt: string | null;
  };
  integrations: AdminIntegrationStatus[];
  flow: AdminIntegrationFlowNode[];
  activities: AdminIntegrationActivity[];
  issues: AdminIntegrationIssue[];
  providerNote: string;
};
