import type { AdminAuditOutcome } from "@/types/admin-audit-logs";

export const adminSettingsKeys = [
  "application.display_name",
  "application.date_format",
  "application.time_format",
  "admin.settings.density",
  "admin.settings.show_status_descriptions",
  "admin.attendance.default_view",
  "admin.attendance.default_source",
  "admin.attendance.show_verification_status",
  "admin.audit.page_size",
  "admin.audit.default_outcome",
] as const;

export type AdminSettingKey = typeof adminSettingsKeys[number];

export type AdminSettingValue = string | number | boolean;

export type AdminSettingCategoryId =
  | "general"
  | "interface"
  | "attendance"
  | "integration"
  | "audit"
  | "system-info";

export type AdminSettingValueType = "boolean" | "number" | "string" | "enum";
export type AdminSettingSource = "runtime" | "environment" | "derived";

export type AdminSettingOption = {
  value: string | number;
  label: string;
};

export type AdminSettingView = {
  key: string;
  category: AdminSettingCategoryId;
  label: string;
  description: string;
  value: AdminSettingValue | null;
  defaultValue: AdminSettingValue | null;
  valueType: AdminSettingValueType;
  editable: boolean;
  sensitive: boolean;
  source: AdminSettingSource;
  requiresRestart: boolean;
  options: readonly AdminSettingOption[];
  updatedAt: string | null;
  updatedBy: string | null;
};

export type AdminSettingsIntegration = {
  key: "hrps" | "bundy" | "qr" | "payroll" | "accounting";
  name: string;
  mode: "local" | "simulated" | "not_configured";
  provider: string | null;
  status: "Configured" | "Simulated" | "Not configured";
  credentialsStatus: "Not applicable" | "Configured" | "Not configured";
  detail: string;
  monitoringHref: string;
};

export type AdminSettingsData = {
  settings: AdminSettingView[];
  summary: {
    totalSettings: number;
    editableSettings: number;
    readOnlySettings: number;
    runtimeSettings: number;
    environmentSettings: number;
  };
  categories: Array<{
    id: AdminSettingCategoryId;
    label: string;
    description: string;
    settingKeys: string[];
  }>;
  integrations: AdminSettingsIntegration[];
  systemInfo: {
    environment: "Development" | "Production";
    version: string;
    campus: string;
    timezone: string;
    status: "Operational";
  };
  version: number;
  updatedAt: string | null;
  updatedBy: string | null;
  auditOutcomeOptions: readonly AdminAuditOutcome[];
};

export type AdminSettingsUpdateRequest = {
  expectedVersion: number;
  settings: Record<string, unknown>;
  resetKeys?: string[];
};
