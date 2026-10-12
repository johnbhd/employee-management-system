import type {
  AdminSettingCategoryId,
  AdminSettingKey,
  AdminSettingOption,
  AdminSettingSource,
  AdminSettingValue,
  AdminSettingValueType,
} from "@/types/admin-settings";

export type AdminSettingDefinition = {
  key: string;
  category: AdminSettingCategoryId;
  label: string;
  description: string;
  valueType: AdminSettingValueType;
  defaultValue: AdminSettingValue | null;
  editable: boolean;
  sensitive: boolean;
  source: AdminSettingSource;
  requiresRestart?: boolean;
  options?: readonly AdminSettingOption[];
};

const dateFormatOptions = [
  { value: "short", label: "Sep 27, 2026" },
  { value: "long", label: "September 27, 2026" },
  { value: "iso", label: "2026-09-27" },
] as const;

const auditOutcomeOptions = [
  { value: "all", label: "All outcomes" },
  { value: "Successful", label: "Successful" },
  { value: "Blocked", label: "Blocked" },
  { value: "Failed", label: "Failed" },
] as const;

export const adminSettingsRegistry: readonly AdminSettingDefinition[] = [
  {
    key: "application.display_name",
    category: "general",
    label: "System display name",
    description: "The application name shown in this settings workspace.",
    valueType: "string",
    defaultValue: "AU-JSC Employee Attendance Integration System",
    editable: true,
    sensitive: false,
    source: "runtime",
  },
  {
    key: "application.date_format",
    category: "general",
    label: "Date format",
    description: "The date preview format used by this administrator workspace.",
    valueType: "enum",
    defaultValue: "short",
    editable: true,
    sensitive: false,
    source: "runtime",
    options: dateFormatOptions,
  },
  {
    key: "application.time_format",
    category: "general",
    label: "Time format",
    description: "The time preview format used by this administrator workspace.",
    valueType: "enum",
    defaultValue: "12-hour",
    editable: true,
    sensitive: false,
    source: "runtime",
    options: [
      { value: "12-hour", label: "12-hour · 4:30 PM" },
      { value: "24-hour", label: "24-hour · 16:30" },
    ],
  },
  {
    key: "admin.settings.density",
    category: "interface",
    label: "Settings density",
    description: "Choose the amount of spacing between settings rows on this workspace.",
    valueType: "enum",
    defaultValue: "comfortable",
    editable: true,
    sensitive: false,
    source: "runtime",
    options: [
      { value: "comfortable", label: "Comfortable" },
      { value: "compact", label: "Compact" },
    ],
  },
  {
    key: "admin.settings.show_status_descriptions",
    category: "interface",
    label: "Status descriptions",
    description: "Keep supporting state descriptions visible beside settings feedback.",
    valueType: "boolean",
    defaultValue: true,
    editable: true,
    sensitive: false,
    source: "runtime",
  },
  {
    key: "admin.attendance.default_view",
    category: "attendance",
    label: "Default attendance view",
    description: "The time range to select when the administrator opens an attendance workspace.",
    valueType: "enum",
    defaultValue: "today",
    editable: true,
    sensitive: false,
    source: "runtime",
    options: [
      { value: "today", label: "Today" },
      { value: "week", label: "Current week" },
      { value: "month", label: "Current month" },
    ],
  },
  {
    key: "admin.attendance.default_source",
    category: "attendance",
    label: "Default attendance source",
    description: "A viewing preference only; Bundy and QR remain coexisting attendance sources.",
    valueType: "enum",
    defaultValue: "all",
    editable: true,
    sensitive: false,
    source: "runtime",
    options: [
      { value: "all", label: "All attendance sources" },
      { value: "bundy", label: "Bundy / Biometric" },
      { value: "qr", label: "QR Attendance" },
      { value: "unified", label: "Unified Attendance" },
    ],
  },
  {
    key: "admin.attendance.show_verification_status",
    category: "attendance",
    label: "Show verification status",
    description: "Keep HR verification context visible in attendance workspace summaries.",
    valueType: "boolean",
    defaultValue: true,
    editable: true,
    sensitive: false,
    source: "runtime",
  },
  {
    key: "admin.audit.page_size",
    category: "audit",
    label: "Default audit page size",
    description: "The number of activity rows requested by the Audit Logs workspace.",
    valueType: "number",
    defaultValue: 10,
    editable: true,
    sensitive: false,
    source: "runtime",
    options: [
      { value: 10, label: "10 rows" },
      { value: 25, label: "25 rows" },
      { value: 50, label: "50 rows" },
    ],
  },
  {
    key: "admin.audit.default_outcome",
    category: "audit",
    label: "Default audit outcome",
    description: "Preselect a non-destructive outcome filter when opening Audit Logs.",
    valueType: "enum",
    defaultValue: "all",
    editable: true,
    sensitive: false,
    source: "runtime",
    options: auditOutcomeOptions,
  },
  {
    key: "application.campus",
    category: "general",
    label: "Campus / institution",
    description: "The current project context is fixed to the AU-JSC campus.",
    valueType: "string",
    defaultValue: "Arellano University – Juan Sumulong Campus",
    editable: false,
    sensitive: false,
    source: "derived",
  },
  {
    key: "application.timezone",
    category: "general",
    label: "Application timezone",
    description: "The application uses the AU-JSC local display timezone.",
    valueType: "string",
    defaultValue: "Asia/Manila",
    editable: false,
    sensitive: false,
    source: "derived",
  },
  {
    key: "application.environment",
    category: "system-info",
    label: "Environment",
    description: "The current server runtime environment.",
    valueType: "string",
    defaultValue: null,
    editable: false,
    sensitive: false,
    source: "environment",
  },
  {
    key: "application.version",
    category: "system-info",
    label: "Application version",
    description: "The application version from package metadata.",
    valueType: "string",
    defaultValue: null,
    editable: false,
    sensitive: false,
    source: "derived",
  },
  {
    key: "integration.hrps.status",
    category: "integration",
    label: "HRPS status",
    description: "The local HRPS employee and schedule reference boundary.",
    valueType: "string",
    defaultValue: null,
    editable: false,
    sensitive: false,
    source: "derived",
  },
  {
    key: "integration.bundy.status",
    category: "integration",
    label: "Bundy / Biometric status",
    description: "Bundy ingestion is shown as not configured until a real adapter exists.",
    valueType: "string",
    defaultValue: null,
    editable: false,
    sensitive: false,
    source: "environment",
  },
  {
    key: "integration.qr.status",
    category: "integration",
    label: "QR Attendance status",
    description: "The QR signing configuration status without exposing its secret.",
    valueType: "string",
    defaultValue: null,
    editable: false,
    sensitive: false,
    source: "environment",
  },
  {
    key: "integration.payroll.mode",
    category: "integration",
    label: "Payroll adapter mode",
    description: "The Payroll adapter mode is controlled by server configuration.",
    valueType: "string",
    defaultValue: null,
    editable: false,
    sensitive: false,
    source: "environment",
  },
  {
    key: "integration.accounting.mode",
    category: "integration",
    label: "Accounting adapter mode",
    description: "The Accounting adapter mode is controlled by server configuration.",
    valueType: "string",
    defaultValue: null,
    editable: false,
    sensitive: false,
    source: "environment",
  },
];

export const adminSettingKeySet = new Set(adminSettingsRegistry.map((setting) => setting.key));
export const adminRuntimeSettingKeySet = new Set(
  adminSettingsRegistry.filter((setting) => setting.editable && setting.source === "runtime").map((setting) => setting.key),
);

export function getAdminSettingDefinition(key: string) {
  return adminSettingsRegistry.find((setting) => setting.key === key) ?? null;
}

export function isAdminSettingKey(value: unknown): value is AdminSettingKey {
  return typeof value === "string" && adminSettingKeySet.has(value);
}
