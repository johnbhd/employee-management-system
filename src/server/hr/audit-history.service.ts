import "server-only";

import {
  formatCampusDateKey,
  formatCampusDateTime,
  formatCampusTime,
} from "@/lib/campus-time";
import {
  listAttendanceForMonitoring,
  type StoredQrAttendanceRecord,
} from "@/server/repositories/attendance/attendance.repository";
import {
  listAttendanceCorrectionRequests,
  type StoredAttendanceCorrectionRequest,
} from "@/server/repositories/attendance-corrections/attendance-correction.repository";
import { listEmployees } from "@/server/repositories/employees/employee.repository";
import type { EmployeeReference } from "@/types/employee";
import {
  auditHistoryActions,
  auditHistoryAreas,
  auditHistoryOutcomes,
  type HrAuditHistoryItem,
  type HrAuditHistoryOption,
  type HrAuditHistoryQuery,
  type HrAuditHistorySummary,
} from "@/types/hr-audit-history";

export type HrAuditHistoryData = {
  events: HrAuditHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  summary: HrAuditHistorySummary;
  actions: HrAuditHistoryOption[];
  areas: HrAuditHistoryOption[];
  actorRoles: HrAuditHistoryOption[];
  outcomes: HrAuditHistoryOption[];
  employees: HrAuditHistoryOption[];
};

type CorrectionSnapshot = NonNullable<
  StoredAttendanceCorrectionRequest["originalAttendance"]
>;

const actionLabels: Record<(typeof auditHistoryActions)[number], string> = {
  "Time In recorded": "Time In recorded",
  "Time Out recorded": "Time Out recorded",
  "Correction Submitted": "Correction Submitted",
  "Correction Approved": "Correction Approved",
  "Correction Rejected": "Correction Rejected",
};

const areaLabels: Record<(typeof auditHistoryAreas)[number], string> = {
  Attendance: "Attendance",
  "Correction Requests": "Correction Requests",
};

const outcomeLabels: Record<(typeof auditHistoryOutcomes)[number], string> = {
  Recorded: "Recorded",
  Submitted: "Submitted",
  Approved: "Approved",
  Rejected: "Rejected",
};

function toEmployee(
  employee: EmployeeReference | undefined,
) {
  return employee
    ? {
        employeeId: employee.employeeId,
        displayName: employee.displayName,
        department: employee.department,
      }
    : null;
}

function operatorRoleLabel(role: "admin" | "hr" | "employee" | "accounting") {
  if (role === "admin") return "IT Administrator";
  if (role === "employee") return "Employee";
  if (role === "accounting") return "Accounting Staff";
  return "HR / Attendance Staff";
}

function correctionStatusLabel(
  status: StoredAttendanceCorrectionRequest["status"],
) {
  if (status === "approved") return "Approved" as const;
  if (status === "rejected") return "Rejected" as const;
  return "Pending" as const;
}

function attendanceDetails(
  id: string,
  record: StoredQrAttendanceRecord | CorrectionSnapshot,
) {
  return {
    id,
    date: record.attendanceDate,
    timeIn: record.timeIn ? formatCampusTime(record.timeIn.toDate()) : null,
    timeOut: record.timeOut ? formatCampusTime(record.timeOut.toDate()) : null,
    source: "QR" as const,
    status: record.status === "completed" ? "Completed" as const : "Present" as const,
  };
}

function correctionReference(
  request: StoredAttendanceCorrectionRequest,
) {
  return {
    id: request.id,
    issueType: request.issueType,
    status: correctionStatusLabel(request.status),
    attendanceDate: request.attendanceDate,
  };
}

function changedFields(
  request: StoredAttendanceCorrectionRequest,
) {
  return request.changedFields.map((change) => ({
    field: change.field === "timeIn" ? "Time In" : "Time Out",
    previousValue: change.previousValue
      ? formatCampusTime(change.previousValue.toDate())
      : null,
    newValue: formatCampusTime(change.newValue.toDate()),
  }));
}

function attendanceEvent(
  id: string,
  record: StoredQrAttendanceRecord,
  employee: EmployeeReference | undefined,
  kind: "timeIn" | "timeOut",
): HrAuditHistoryItem {
  const timestamp = kind === "timeIn" ? record.timeIn : record.timeOut;
  const operator = kind === "timeIn" ? record.timeInOperator : record.timeOutOperator;
  const action = kind === "timeIn" ? "Time In recorded" : "Time Out recorded";

  if (!timestamp) {
    throw new Error("An attendance event requires a persisted timestamp.");
  }

  return {
    id: `${id}:${kind}`,
    occurredAt: formatCampusDateTime(timestamp.toDate()),
    occurredAtDate: formatCampusDateKey(timestamp.toDate()),
    occurredAtTimestamp: timestamp.toMillis(),
    action,
    area: "Attendance",
    actor: {
      displayName: operator?.displayName ?? null,
      role: operator ? operatorRoleLabel(operator.role) : null,
    },
    employee: toEmployee(employee),
    attendanceRecordId: id,
    correctionRequest: null,
    attendanceRecord: attendanceDetails(id, record),
    changes: [],
    note: null,
    outcome: "Recorded",
  };
}

function correctionEvent(
  request: StoredAttendanceCorrectionRequest,
  employee: EmployeeReference | undefined,
  attendanceById: ReadonlyMap<string, StoredQrAttendanceRecord>,
  kind: "submitted" | "decision",
): HrAuditHistoryItem | null {
  const timestamp = kind === "submitted" ? request.submittedAt : request.reviewedAt;
  const actor = kind === "submitted" ? request.submittedBy : request.reviewedBy;

  if (!timestamp || !actor) return null;

  const currentAttendance = attendanceById.get(request.attendanceRecordId);
  const snapshot = kind === "submitted"
    ? request.originalAttendance ?? currentAttendance ?? null
    : request.status === "approved"
      ? request.resultingAttendance ?? currentAttendance ?? null
      : request.originalAttendance ?? currentAttendance ?? null;
  const action = kind === "submitted"
    ? "Correction Submitted"
    : request.status === "approved"
      ? "Correction Approved"
      : "Correction Rejected";

  return {
    id: `${request.id}:${kind}`,
    occurredAt: formatCampusDateTime(timestamp.toDate()),
    occurredAtDate: formatCampusDateKey(timestamp.toDate()),
    occurredAtTimestamp: timestamp.toMillis(),
    action,
    area: "Correction Requests",
    actor: {
      displayName: actor.displayName,
      role: operatorRoleLabel(actor.role),
    },
    employee: toEmployee(employee),
    attendanceRecordId: request.attendanceRecordId,
    correctionRequest: correctionReference(request),
    attendanceRecord: snapshot
      ? attendanceDetails(request.attendanceRecordId, snapshot)
      : null,
    changes: kind === "decision" && request.status === "approved"
      ? changedFields(request)
      : [],
    note: kind === "submitted"
      ? request.reason || null
      : request.reviewNote,
    outcome: kind === "submitted"
      ? "Submitted"
      : request.status === "approved"
        ? "Approved"
        : "Rejected",
  };
}

async function buildAuditEvents() {
  const [employees, attendanceDocuments, correctionRequests] = await Promise.all([
    listEmployees(),
    listAttendanceForMonitoring(),
    listAttendanceCorrectionRequests(),
  ]);
  const employeesById = new Map(
    employees.map((employee) => [employee.employeeId, employee]),
  );
  const attendanceById = new Map(
    attendanceDocuments.map(({ id, record }) => [id, record]),
  );
  const attendanceEvents = attendanceDocuments.flatMap(({ id, record }) => [
    attendanceEvent(id, record, employeesById.get(record.employeeId), "timeIn"),
    ...(record.timeOut
      ? [attendanceEvent(id, record, employeesById.get(record.employeeId), "timeOut")]
      : []),
  ]);
  const correctionEvents = correctionRequests.flatMap((request) => [
    correctionEvent(request, employeesById.get(request.employeeId), attendanceById, "submitted"),
    correctionEvent(request, employeesById.get(request.employeeId), attendanceById, "decision"),
  ]).filter((event): event is HrAuditHistoryItem => event !== null);

  return {
    employees,
    events: [...attendanceEvents, ...correctionEvents].sort(
      (left, right) => right.occurredAtTimestamp - left.occurredAtTimestamp
        || right.id.localeCompare(left.id),
    ),
  };
}

function matchesSearch(event: HrAuditHistoryItem, search: string) {
  if (!search) return true;

  const values = [
    event.id,
    event.action,
    event.area,
    event.actor.displayName,
    event.actor.role,
    event.employee?.displayName,
    event.employee?.employeeId,
    event.attendanceRecordId,
    event.correctionRequest?.id,
    event.note,
  ];

  return values.some((value) => value?.toLowerCase().includes(search));
}

function filterEvents(
  events: readonly HrAuditHistoryItem[],
  query: HrAuditHistoryQuery,
) {
  const search = query.search.toLowerCase();

  return events.filter((event) => (
    matchesSearch(event, search)
    && (!query.fromDate || event.occurredAtDate >= query.fromDate)
    && (!query.toDate || event.occurredAtDate <= query.toDate)
    && (!query.action || event.action === query.action)
    && (!query.area || event.area === query.area)
    && (!query.actorRole || event.actor.role === query.actorRole)
    && (!query.outcome || event.outcome === query.outcome)
    && (!query.employeeId || event.employee?.employeeId === query.employeeId)
  ));
}

function buildSummary(events: readonly HrAuditHistoryItem[]): HrAuditHistorySummary {
  return {
    total: events.length,
    attendance: events.filter((event) => event.area === "Attendance").length,
    qr: events.filter((event) => event.attendanceRecord?.source === "QR").length,
    corrections: events.filter((event) => event.area === "Correction Requests").length,
    approved: events.filter((event) => event.action === "Correction Approved").length,
    rejected: events.filter((event) => event.action === "Correction Rejected").length,
  };
}

function buildOptions(
  values: readonly string[],
  allLabel: string,
  labels?: Readonly<Record<string, string>>,
): HrAuditHistoryOption[] {
  return [
    { value: "all", label: allLabel },
    ...values.map((value) => ({ value, label: labels?.[value] ?? value })),
  ];
}

function buildEmployeeOptions(employees: readonly EmployeeReference[]) {
  return [
    { value: "all", label: "All employees" },
    ...employees.map((employee) => ({
      value: employee.employeeId,
      label: `${employee.displayName} · ${employee.employeeId}`,
    })),
  ];
}

function getActorRoles(events: readonly HrAuditHistoryItem[]) {
  return Array.from(new Set(
    events
      .map((event) => event.actor.role)
      .filter((role): role is string => Boolean(role)),
  )).sort();
}

export async function getHrAuditHistory(
  query: HrAuditHistoryQuery,
): Promise<HrAuditHistoryData> {
  const { employees, events } = await buildAuditEvents();
  const filteredEvents = filterEvents(events, query);
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;

  return {
    events: filteredEvents.slice(start, start + query.pageSize),
    total: filteredEvents.length,
    page,
    pageSize: query.pageSize,
    hasNext: page < totalPages,
    summary: buildSummary(filteredEvents),
    actions: buildOptions(auditHistoryActions, "All actions", actionLabels),
    areas: buildOptions(auditHistoryAreas, "All areas", areaLabels),
    actorRoles: buildOptions(getActorRoles(events), "All roles"),
    outcomes: buildOptions(auditHistoryOutcomes, "All outcomes", outcomeLabels),
    employees: buildEmployeeOptions(employees),
  };
}

export async function getHrAuditHistoryExportEvents(
  query: HrAuditHistoryQuery,
) {
  const { events } = await buildAuditEvents();

  return filterEvents(events, query);
}

export function createHrAuditHistoryCsv(
  events: readonly HrAuditHistoryItem[],
) {
  const escape = (value: string | number | null | undefined) => (
    `"${String(value ?? "").replaceAll('"', '""')}"`
  );
  const headers = [
    "Audit Event ID",
    "Date / Time",
    "Action",
    "Actor",
    "Actor Role",
    "Employee ID",
    "Employee Name",
    "Area",
    "Attendance Record ID",
    "Correction Request ID",
    "Field Changed",
    "Previous Value",
    "New Value",
    "Outcome",
  ];
  const rows = events.flatMap((event) => {
    const changes = event.changes.length > 0
      ? event.changes
      : [{ field: null, previousValue: null, newValue: null }];

    return changes.map((change) => [
      event.id,
      event.occurredAt,
      event.action,
      event.actor.displayName,
      event.actor.role,
      event.employee?.employeeId,
      event.employee?.displayName,
      event.area,
      event.attendanceRecordId,
      event.correctionRequest?.id,
      change.field,
      change.previousValue,
      change.newValue,
      event.outcome,
    ]);
  });

  return [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");
}
