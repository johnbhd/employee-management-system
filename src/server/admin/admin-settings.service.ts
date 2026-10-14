import "server-only";

import packageJson from "../../../package.json";

import { getAccountingIntegrationMode } from "@/server/accounting/accounting-integration.adapter";
import { getPayrollIntegrationMode } from "@/server/payroll/integration/payroll-integration-adapter";
import { getAuditEventDefinition } from "@/server/audit/audit-registry";
import { formatCampusDateTime } from "@/lib/campus-time";
import { listEmployeeScheduleReferences } from "@/server/repositories/employee-schedules/employee-schedule.repository";
import { listEmployees } from "@/server/repositories/employees/employee.repository";
import {
  getRuntimeSettings,
  SettingsRepositoryConflictError,
  type RuntimeSettingsSnapshot,
  updateRuntimeSettings,
} from "@/server/repositories/settings/settings.repository";
import { recordAuditEvent } from "@/server/repositories/audit/audit.repository";
import type { SessionUser } from "@/types/auth";
import type {
  AdminSettingCategoryId,
  AdminSettingOption,
  AdminSettingValue,
  AdminSettingView,
  AdminSettingsData,
  AdminSettingsIntegration,
  AdminSettingsUpdateRequest,
} from "@/types/admin-settings";
import type { AdminAuditOutcome } from "@/types/admin-audit-logs";

import {
  adminSettingKeySet,
  adminSettingsRegistry,
  adminRuntimeSettingKeySet,
  getAdminSettingDefinition,
} from "./admin-settings-registry";

export { SettingsRepositoryConflictError };

const campus = "Arellano University – Juan Sumulong Campus";
const timezone = "Asia/Manila";
const auditOutcomeOptions: readonly AdminAuditOutcome[] = ["Successful", "Blocked", "Failed"];

const categoryDefinitions: ReadonlyArray<{
  id: AdminSettingCategoryId;
  label: string;
  description: string;
}> = [
  { id: "general", label: "General", description: "Application identity and display formats" },
  { id: "interface", label: "Interface", description: "Admin workspace presentation" },
  { id: "attendance", label: "Attendance", description: "Safe administrator workspace defaults" },
  { id: "integration", label: "Integration", description: "Monitored application boundaries" },
  { id: "audit", label: "Audit & Logs", description: "Activity display preferences" },
  { id: "system-info", label: "System Information", description: "Safe application metadata" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function displayValue(value: AdminSettingValue | null): string {
  if (value === null) return "Not available";
  if (typeof value === "boolean") return value ? "On" : "Off";
  return String(value);
}

function optionValues(options: readonly AdminSettingOption[] | undefined) {
  return new Set((options ?? []).map((option) => option.value));
}

function validateSettingValue(key: string, value: unknown): AdminSettingValue {
  const definition = getAdminSettingDefinition(key);
  if (!definition || !definition.editable || definition.source !== "runtime") {
    throw new AdminSettingsError("SETTING_NOT_EDITABLE", `The setting ${key} cannot be changed.`, 400);
  }

  if (definition.valueType === "boolean") {
    if (typeof value !== "boolean") {
      throw new AdminSettingsError("SETTING_VALUE_INVALID", `${definition.label} must be a boolean value.`, 400);
    }
    return value;
  }

  if (definition.valueType === "number") {
    if (typeof value !== "number" || !Number.isInteger(value) || !optionValues(definition.options).has(value)) {
      throw new AdminSettingsError("SETTING_VALUE_INVALID", `${definition.label} must use one of the supported values.`, 400);
    }
    return value;
  }

  if (typeof value !== "string") {
    throw new AdminSettingsError("SETTING_VALUE_INVALID", `${definition.label} must be text.`, 400);
  }

  const normalized = value.trim();
  if (definition.key === "application.display_name") {
    if (normalized.length < 3 || normalized.length > 120) {
      throw new AdminSettingsError("SETTING_VALUE_INVALID", "System display name must be between 3 and 120 characters.", 400);
    }
    return normalized;
  }

  if (definition.valueType === "enum" && !optionValues(definition.options).has(normalized)) {
    throw new AdminSettingsError("SETTING_VALUE_INVALID", `${definition.label} must use one of the supported values.`, 400);
  }

  return normalized;
}

function validRuntimeValue(
  definition: (typeof adminSettingsRegistry)[number],
  value: unknown,
): AdminSettingValue {
  try {
    return validateSettingValue(definition.key, value);
  } catch {
    return definition.defaultValue as AdminSettingValue;
  }
}

function resolvedRuntimeValue(
  definition: (typeof adminSettingsRegistry)[number],
  snapshot: RuntimeSettingsSnapshot,
): AdminSettingValue | null {
  if (definition.source !== "runtime") return definition.defaultValue;
  const stored = snapshot.overrides[definition.key];
  return stored === undefined ? definition.defaultValue : validRuntimeValue(definition, stored);
}

function settingView(
  definition: (typeof adminSettingsRegistry)[number],
  snapshot: RuntimeSettingsSnapshot,
  readOnlyValues: Readonly<Record<string, AdminSettingValue | null>>,
): AdminSettingView {
  const value = definition.source === "runtime"
    ? resolvedRuntimeValue(definition, snapshot)
    : readOnlyValues[definition.key] ?? definition.defaultValue;
  const hasRuntimeOverride = definition.source === "runtime" && snapshot.overrides[definition.key] !== undefined;

  return {
    key: definition.key,
    category: definition.category,
    label: definition.label,
    description: definition.description,
    value,
    defaultValue: definition.defaultValue,
    valueType: definition.valueType,
    editable: definition.editable,
    sensitive: definition.sensitive,
    source: definition.source,
    requiresRestart: definition.requiresRestart ?? false,
    options: definition.options ?? [],
    updatedAt: hasRuntimeOverride ? snapshot.updatedAt : null,
    updatedBy: hasRuntimeOverride ? snapshot.updatedBy?.displayName ?? null : null,
  };
}

function integrationStatus(input: AdminSettingsIntegration): AdminSettingsIntegration {
  return input;
}

async function getIntegrationSettings(): Promise<{
  integrations: AdminSettingsIntegration[];
  values: Record<string, AdminSettingValue | null>;
}> {
  const [employees, schedules] = await Promise.all([
    listEmployees(),
    listEmployeeScheduleReferences(),
  ]);
  const qrConfigured = Boolean(process.env.QR_ATTENDANCE_SIGNING_SECRET?.trim());
  const payrollMode = getPayrollIntegrationMode();
  const accountingMode = getAccountingIntegrationMode();
  const integrations = [
    integrationStatus({
      key: "hrps",
      name: "HRPS employee reference",
      mode: "local",
      provider: "Firestore employee and schedule repositories",
      status: "Configured",
      credentialsStatus: "Not applicable",
      detail: `${employees.length} employee reference${employees.length === 1 ? "" : "s"} and ${schedules.length} schedule reference${schedules.length === 1 ? "" : "s"} loaded from the local HRPS boundary.`,
      monitoringHref: "/admin/hrps-integration",
    }),
    integrationStatus({
      key: "bundy",
      name: "Bundy / Biometric ETL",
      mode: "not_configured",
      provider: null,
      status: "Not configured",
      credentialsStatus: "Not applicable",
      detail: "No Bundy ingestion adapter or persisted Bundy log repository is configured.",
      monitoringHref: "/admin/bundy-etl",
    }),
    integrationStatus({
      key: "qr",
      name: "QR Attendance",
      mode: "local",
      provider: "Server QR signing and Firestore attendance repository",
      status: qrConfigured ? "Configured" : "Not configured",
      credentialsStatus: "Not applicable",
      detail: qrConfigured
        ? "The server-side QR signing secret is configured; its value is never returned."
        : "QR signing is not configured in the server environment.",
      monitoringHref: "/admin/qr-attendance",
    }),
    integrationStatus({
      key: "payroll",
      name: "Payroll integration",
      mode: payrollMode,
      provider: "simulated-payroll-adapter",
      status: "Simulated",
      credentialsStatus: "Not configured",
      detail: "Payroll handoff uses the deterministic simulated adapter. No live Payroll API credentials are configured.",
      monitoringHref: "/admin/payroll-integration",
    }),
    integrationStatus({
      key: "accounting",
      name: "Accounting integration",
      mode: accountingMode,
      provider: "simulated-accounting-adapter",
      status: "Simulated",
      credentialsStatus: "Not configured",
      detail: "Accounting transfer uses the deterministic simulated adapter. No live Accounting API credentials are configured.",
      monitoringHref: "/admin/accounting-integration",
    }),
  ];

  return {
    integrations,
    values: {
      "integration.hrps.status": integrations[0].status,
      "integration.bundy.status": integrations[1].status,
      "integration.qr.status": integrations[2].status,
      "integration.payroll.mode": integrations[3].status,
      "integration.accounting.mode": integrations[4].status,
    },
  };
}

function buildData(snapshot: RuntimeSettingsSnapshot, integrationData: Awaited<ReturnType<typeof getIntegrationSettings>>): AdminSettingsData {
  const environment = process.env.NODE_ENV === "production" ? "Production" : "Development";
  const readOnlyValues: Record<string, AdminSettingValue | null> = {
    "application.campus": campus,
    "application.timezone": timezone,
    "application.environment": environment,
    "application.version": typeof packageJson.version === "string" ? packageJson.version : "0.1.0",
    ...integrationData.values,
  };
  const settings = adminSettingsRegistry.map((definition) => settingView(definition, snapshot, readOnlyValues));
  const categories = categoryDefinitions.map((category) => ({
    ...category,
    settingKeys: settings.filter((setting) => setting.category === category.id).map((setting) => setting.key),
  }));

  return {
    settings,
    summary: {
      totalSettings: settings.length,
      editableSettings: settings.filter((setting) => setting.editable).length,
      readOnlySettings: settings.filter((setting) => !setting.editable).length,
      runtimeSettings: settings.filter((setting) => setting.source === "runtime").length,
      environmentSettings: settings.filter((setting) => setting.source === "environment").length,
    },
    categories,
    integrations: integrationData.integrations,
    systemInfo: {
      environment,
      version: typeof packageJson.version === "string" ? packageJson.version : "0.1.0",
      campus,
      timezone,
      status: "Operational",
    },
    version: snapshot.version,
    updatedAt: snapshot.updatedAt,
    updatedBy: snapshot.updatedBy?.displayName ?? null,
    auditOutcomeOptions,
  };
}

export class AdminSettingsError extends Error {
  readonly code: string;
  readonly status: 400 | 409;

  constructor(code: string, message: string, status: 400 | 409 = 400) {
    super(message);
    this.name = "AdminSettingsError";
    this.code = code;
    this.status = status;
  }
}

export async function getAdminSettingsData(): Promise<AdminSettingsData> {
  const [snapshot, integrationData] = await Promise.all([
    getRuntimeSettings(),
    getIntegrationSettings(),
  ]);
  return buildData(snapshot, integrationData);
}

function settingChangeValue(value: AdminSettingValue | null) {
  return value === null ? null : displayValue(value);
}

export async function updateAdminSettings(input: {
  actor: Pick<SessionUser, "uid" | "displayName" | "role">;
  request: AdminSettingsUpdateRequest;
}): Promise<AdminSettingsData> {
  const request = input.request;
  if (!Number.isInteger(request.expectedVersion) || request.expectedVersion < 0) {
    throw new AdminSettingsError("SETTINGS_VERSION_INVALID", "A valid settings version is required.", 400);
  }
  if (!isRecord(request.settings)) {
    throw new AdminSettingsError("SETTINGS_UPDATE_INVALID", "A settings object is required.", 400);
  }
  if (request.resetKeys !== undefined && (!Array.isArray(request.resetKeys) || request.resetKeys.some((key) => typeof key !== "string"))) {
    throw new AdminSettingsError("SETTINGS_RESET_INVALID", "Reset keys must be a list of setting keys.", 400);
  }

  const updateKeys = Object.keys(request.settings);
  const resetKeys = request.resetKeys ?? [];
  for (const key of [...updateKeys, ...resetKeys]) {
    if (!adminSettingKeySet.has(key)) {
      throw new AdminSettingsError("SETTING_UNKNOWN", `The setting ${key} is not registered.`, 400);
    }
    if (!adminRuntimeSettingKeySet.has(key)) {
      throw new AdminSettingsError("SETTING_NOT_EDITABLE", `The setting ${key} is read-only.`, 400);
    }
  }
  if (new Set(resetKeys).size !== resetKeys.length) {
    throw new AdminSettingsError("SETTINGS_RESET_INVALID", "Reset keys must not contain duplicates.", 400);
  }

  const current = await getRuntimeSettings();
  if (current.version !== request.expectedVersion) {
    throw new SettingsRepositoryConflictError();
  }

  const nextOverrides = { ...current.overrides };
  const changes: Array<{ field: string; previousValue: string | null; newValue: string | null }> = [];
  const keys = [...new Set([...updateKeys, ...resetKeys])];

  for (const key of keys) {
    const definition = getAdminSettingDefinition(key);
    if (!definition) continue;
    const previousValue = resolvedRuntimeValue(definition, current);
    const nextValue = resetKeys.includes(key)
      ? definition.defaultValue
      : validateSettingValue(key, request.settings[key]);
    if (previousValue === nextValue) continue;

    if (nextValue === definition.defaultValue) {
      delete nextOverrides[key];
    } else {
      nextOverrides[key] = nextValue;
    }
    changes.push({
      field: key,
      previousValue: settingChangeValue(previousValue),
      newValue: settingChangeValue(nextValue),
    });
  }

  if (changes.length > 0) {
    const saved = await updateRuntimeSettings({
      overrides: nextOverrides,
      expectedVersion: request.expectedVersion,
      updatedBy: { uid: input.actor.uid, displayName: input.actor.displayName },
    });
    const eventDefinition = getAuditEventDefinition("admin.settings.updated");
    await recordAuditEvent({
      eventType: "admin.settings.updated",
      action: eventDefinition?.action ?? "System Settings Updated",
      module: eventDefinition?.module ?? "System Settings",
      actor: {
        type: "user",
        uid: input.actor.uid,
        displayName: input.actor.displayName,
        role: input.actor.role,
      },
      target: {
        type: "system_settings",
        id: "runtime",
        reference: "systemSettings/runtime",
        label: "Runtime application settings",
      },
      outcome: "Successful",
      summary: `${changes.length} supported system setting${changes.length === 1 ? "" : "s"} updated.`,
      metadata: { changes, version: saved.version },
    });
    const integrationData = await getIntegrationSettings();
    return buildData(saved, integrationData);
  }

  const integrationData = await getIntegrationSettings();
  return buildData(current, integrationData);
}

export function getSettingsUpdatedAtLabel(data: AdminSettingsData) {
  return data.updatedAt ? formatCampusDateTime(new Date(data.updatedAt)) : "No runtime override has been saved.";
}
