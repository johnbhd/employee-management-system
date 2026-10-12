import "server-only";

import { formatCampusDateKey, formatCampusDateTime } from "@/lib/campus-time";
import { auditEventRegistry } from "@/server/audit/audit-registry";
import { getAuditEventById, listAuditEvents, type AuditStoredEvent } from "@/server/repositories/audit/audit.repository";
import { getRuntimeSettings } from "@/server/repositories/settings/settings.repository";
import type {
  AdminAuditChange,
  AdminAuditLog,
  AdminAuditLogsData,
  AdminAuditLogsQuery,
  AdminAuditOutcome,
} from "@/types/admin-audit-logs";

const defaultPageSize = 10;
const maxPageSize = 50;
const safeMetadataKeys = new Set([
  "previousRole",
  "newRole",
  "addedPermissions",
  "removedPermissions",
  "batchId",
  "transferId",
  "resultId",
  "failureCode",
  "attemptNumber",
  "version",
  "changes",
]);

function roleLabel(role: string | null) {
  switch (role) {
    case "admin": return "IT Administrator";
    case "hr": return "HR / Attendance Staff";
    case "employee": return "Employee";
    case "payroll": return "Payroll Staff";
    case "accounting": return "Accounting Staff";
    case "system": return "System Process";
    default: return role;
  }
}

function safeValue(value: unknown): string | number | boolean | null | string[] | undefined {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value;
  return undefined;
}

function safeMetadata(metadata: Readonly<Record<string, unknown>>) {
  return Object.entries(metadata).reduce<Record<string, string | number | boolean | null | string[]>>((result, [key, value]) => {
    if (!safeMetadataKeys.has(key)) return result;
    const sanitized = safeValue(value);
    if (sanitized !== undefined) result[key] = sanitized;
    return result;
  }, {});
}

function changesFromMetadata(metadata: Readonly<Record<string, unknown>>): AdminAuditChange[] {
  const raw = metadata.changes;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    const field = typeof candidate.field === "string" ? candidate.field : null;
    const previousValue = candidate.previousValue ?? candidate.from;
    const newValue = candidate.newValue ?? candidate.to;
    if (!field || (typeof previousValue !== "string" && previousValue !== null) || typeof newValue !== "string" && newValue !== null) return [];
    return [{ field, previousValue: previousValue ?? "—", newValue: newValue ?? "—" }];
  });
}

function toListItem(event: AuditStoredEvent): AdminAuditLog {
  const occurredAtDate = formatCampusDateKey(new Date(event.occurredAt));
  return {
    id: event.id,
    eventType: event.eventType,
    occurredAt: formatCampusDateTime(new Date(event.occurredAt)),
    occurredAtDate,
    occurredAtTimestamp: new Date(event.occurredAt).getTime(),
    action: event.action,
    module: event.module,
    actor: {
      type: event.actor.type,
      name: event.actor.displayName,
      role: roleLabel(event.actor.role),
      userId: event.actor.uid,
    },
    target: {
      type: event.target.type,
      id: event.target.id,
      reference: event.target.reference,
      label: event.target.label,
    },
    outcome: event.outcome,
    changes: changesFromMetadata(event.metadata),
    details: event.summary,
    metadata: safeMetadata(event.metadata),
  };
}

function matchesSearch(event: AdminAuditLog, search: string) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return true;
  return [
    event.id,
    event.eventType,
    event.action,
    event.module,
    event.actor.name,
    event.actor.role,
    event.target.reference,
    event.target.label,
    event.details,
  ].filter(Boolean).join(" ").toLowerCase().includes(normalized);
}

function filterEvents(events: readonly AdminAuditLog[], query: AdminAuditLogsQuery) {
  return events.filter((event) => (
    matchesSearch(event, query.search)
    && (!query.from || event.occurredAtDate >= query.from)
    && (!query.to || event.occurredAtDate <= query.to)
    && (!query.role || event.actor.role === roleLabel(query.role) || event.actor.role === query.role)
    && (!query.module || event.module === query.module)
    && (!query.action || event.action === query.action)
    && (!query.outcome || event.outcome === query.outcome)
  ));
}

function optionsFrom(events: readonly AdminAuditLog[]): AdminAuditLogsData["options"] {
  const roles = Array.from(new Set(events.map((event) => event.actor.role).filter((value): value is string => Boolean(value)))).sort();
  const modules = Array.from(new Set([
    ...auditEventRegistry.map((event) => event.module),
    ...events.map((event) => event.module),
  ])).sort();
  const actions = Array.from(new Set([
    ...auditEventRegistry.map((event) => event.action),
    ...events.map((event) => event.action),
  ])).sort();
  return { roles, modules, actions, outcomes: ["Successful", "Blocked", "Failed"] };
}

function summaryFrom(events: readonly AdminAuditLog[]) {
  return {
    recorded: events.length,
    successful: events.filter((event) => event.outcome === "Successful").length,
    blocked: events.filter((event) => event.outcome === "Blocked").length,
    failed: events.filter((event) => event.outcome === "Failed").length,
  };
}

function coverageFrom(events: readonly AdminAuditLog[]) {
  const counts = new Map<string, number>();
  for (const event of events) counts.set(event.module, (counts.get(event.module) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([module, count]) => ({ module, count }))
    .sort((left, right) => right.count - left.count || left.module.localeCompare(right.module));
}

export async function getDefaultAdminAuditLogsQuery(): Promise<AdminAuditLogsQuery> {
  const runtime = await getRuntimeSettings();
  const configuredPageSize = runtime.overrides["admin.audit.page_size"];
  const pageSize = configuredPageSize === 25 || configuredPageSize === 50 ? configuredPageSize : defaultPageSize;
  const configuredOutcome = runtime.overrides["admin.audit.default_outcome"];
  const outcome = configuredOutcome === "Successful" || configuredOutcome === "Blocked" || configuredOutcome === "Failed"
    ? configuredOutcome
    : null;
  return { search: "", from: null, to: null, role: null, module: null, action: null, outcome, page: 1, pageSize };
}

export async function getAdminAuditLogsData(query: AdminAuditLogsQuery): Promise<AdminAuditLogsData> {
  if (query.page < 1 || query.pageSize < 1 || query.pageSize > maxPageSize) throw new Error("Audit log pagination values are invalid.");
  if (query.from && query.to && query.from > query.to) throw new Error("The audit date range is invalid.");
  const allEvents = (await listAuditEvents()).map(toListItem);
  const filtered = filterEvents(allEvents, query);
  const totalPages = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;
  return {
    events: filtered.slice(start, start + query.pageSize),
    total: filtered.length,
    page,
    pageSize: query.pageSize,
    hasNext: page < totalPages,
    summary: summaryFrom(filtered),
    coverage: coverageFrom(filtered),
    options: optionsFrom(allEvents),
    defaults: { pageSize: query.pageSize, outcome: query.outcome },
  };
}

export async function getAdminAuditLogDetail(id: string) {
  const event = await getAuditEventById(id);
  return event ? toListItem(event) : null;
}

export function parseAdminAuditOutcome(value: string | null): AdminAuditOutcome | null {
  return value === "Successful" || value === "Blocked" || value === "Failed" ? value : null;
}

