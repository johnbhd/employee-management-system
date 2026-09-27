import type {
  HrCorrectionHistoryItem,
  HrCorrectionRequest,
  HrCorrectionRequestStatus,
} from "./hr-correction-requests";
import { hrCorrectionRequests } from "./hr-correction-requests";
import { hrAttendanceMonitoringRecords, type HrAttendanceMonitoringRecord } from "./hr";

export type AttendanceAuditAction =
  | "Correction Submitted"
  | "Correction Reviewed"
  | "Correction Approved"
  | "Correction Rejected"
  | "Information Requested"
  | "Attendance Verified";

export type AttendanceAuditArea = "Correction Requests" | "Attendance Monitoring";
export type AttendanceAuditActorRole = "Employee" | "HR / Attendance Staff";
export type AttendanceAuditOutcome =
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Needs Information"
  | "Verified";

export type AttendanceAuditChange = {
  field: string;
  previousValue: string;
  newValue: string;
};

export type AttendanceAuditEmployee = {
  employeeId: string;
  name: string;
  department: string;
};

export type AttendanceAuditRecord = {
  id: string;
  date: string;
  schedule: string;
  source: string;
  status: HrAttendanceMonitoringRecord["status"];
  validationStatus: HrAttendanceMonitoringRecord["validationStatus"];
};

export type AttendanceAuditRequest = {
  id: string;
  issueType: HrCorrectionRequest["issueType"];
  status: HrCorrectionRequestStatus;
  attendanceDate: string;
};

export type AttendanceAuditActor = {
  name: string;
  role: AttendanceAuditActorRole;
};

export type AttendanceAuditEvent = {
  id: string;
  occurredAt: string;
  occurredAtDate: string;
  occurredAtTimestamp: number;
  action: AttendanceAuditAction;
  area: AttendanceAuditArea;
  actor: AttendanceAuditActor;
  employee: AttendanceAuditEmployee;
  attendanceRecordId: string;
  correctionRequest: AttendanceAuditRequest | null;
  attendanceRecord: AttendanceAuditRecord | null;
  changes: readonly AttendanceAuditChange[];
  note?: string;
  outcome: AttendanceAuditOutcome;
};

const allValue = "all";

export const auditActionOptions = [
  { value: allValue, label: "All actions" },
  { value: "Correction Submitted", label: "Correction Submitted" },
  { value: "Correction Reviewed", label: "Correction Reviewed" },
  { value: "Correction Approved", label: "Correction Approved" },
  { value: "Correction Rejected", label: "Correction Rejected" },
  { value: "Information Requested", label: "Information Requested" },
  { value: "Attendance Verified", label: "Attendance Verified" },
] as const;

export const auditAreaOptions = [
  { value: allValue, label: "All areas" },
  { value: "Correction Requests", label: "Correction Requests" },
  { value: "Attendance Monitoring", label: "Attendance Monitoring" },
] as const;

export const auditActorRoleOptions = [
  { value: allValue, label: "All roles" },
  { value: "Employee", label: "Employee" },
  { value: "HR / Attendance Staff", label: "HR / Attendance Staff" },
] as const;

export const auditOutcomeOptions = [
  { value: allValue, label: "All outcomes" },
  { value: "Submitted", label: "Submitted" },
  { value: "Under Review", label: "Under Review" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "Needs Information", label: "Needs Information" },
  { value: "Verified", label: "Verified" },
] as const;

const fieldLabels = {
  timeIn: "Requested Time In",
  timeOut: "Requested Time Out",
  source: "Requested Source",
} as const;

const attendanceRecordById = new Map(
  hrAttendanceMonitoringRecords.map((record) => [record.id, record]),
);

function parseOccurredAt(value: string) {
  return new Date(value.replace(" · ", " "));
}

function occurredAtDate(value: string, fallback: string) {
  const parsed = parseOccurredAt(value);

  if (Number.isNaN(parsed.getTime())) return fallback;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildRequestedChanges(request: HrCorrectionRequest) {
  return (Object.keys(fieldLabels) as (keyof typeof fieldLabels)[]).flatMap((field) => {
    const requestedValue = request.requestedValues[field];

    if (!requestedValue) return [];

    return [{
      field: fieldLabels[field],
      previousValue: request.currentValues[field] ?? "—",
      newValue: requestedValue,
    }];
  });
}

function mapHistoryAction(item: HrCorrectionHistoryItem) {
  if (item.action === "Request submitted") return "Correction Submitted" as const;
  if (item.action === "Opened for review") return "Correction Reviewed" as const;
  if (item.action === "Correction approved") return "Correction Approved" as const;
  if (item.action === "Correction rejected") return "Correction Rejected" as const;
  return "Information Requested" as const;
}

function mapOutcome(action: AttendanceAuditAction): AttendanceAuditOutcome {
  if (action === "Correction Submitted") return "Submitted";
  if (action === "Correction Reviewed") return "Under Review";
  if (action === "Correction Approved") return "Approved";
  if (action === "Correction Rejected") return "Rejected";
  if (action === "Attendance Verified") return "Verified";
  return "Needs Information";
}

function statusChange(
  previousStatus: AttendanceAuditOutcome | undefined,
  outcome: AttendanceAuditOutcome,
): AttendanceAuditChange[] {
  if (!previousStatus || previousStatus === outcome || outcome === "Submitted") return [];

  return [{
    field: "Correction Status",
    previousValue: previousStatus,
    newValue: outcome,
  }];
}

function actorForHistoryItem(item: HrCorrectionHistoryItem, request: HrCorrectionRequest): AttendanceAuditActor {
  if (item.actor === "Employee") {
    return {
      name: request.employeeName,
      role: "Employee",
    };
  }

  return {
    name: "HR / Attendance Staff",
    role: "HR / Attendance Staff",
  };
}

function buildAttendanceRecord(record: HrAttendanceMonitoringRecord | undefined): AttendanceAuditRecord | null {
  if (!record) return null;

  return {
    id: record.id,
    date: record.date,
    schedule: record.schedule,
    source: record.source ?? "No source recorded",
    status: record.status,
    validationStatus: record.validationStatus,
  };
}

function buildEventsForRequest(request: HrCorrectionRequest): AttendanceAuditEvent[] {
  let previousOutcome: AttendanceAuditOutcome | undefined;
  const attendanceRecord = buildAttendanceRecord(attendanceRecordById.get(request.attendanceRecordId));

  return request.history.map((item, index) => {
    const action = mapHistoryAction(item);
    const outcome = mapOutcome(action);
    const changes = action === "Correction Submitted"
      ? buildRequestedChanges(request)
      : statusChange(previousOutcome, outcome);
    const eventDate = occurredAtDate(item.occurredAt, request.attendanceDate);
    const event = {
      id: `AUD-${request.id.replace("CR-", "")}-${String(index + 1).padStart(2, "0")}`,
      occurredAt: item.occurredAt,
      occurredAtDate: eventDate,
      occurredAtTimestamp: parseOccurredAt(item.occurredAt).getTime(),
      action,
      area: "Correction Requests" as const,
      actor: actorForHistoryItem(item, request),
      employee: {
        employeeId: request.employeeId,
        name: request.employeeName,
        department: request.department,
      },
      attendanceRecordId: request.attendanceRecordId,
      correctionRequest: {
        id: request.id,
        issueType: request.issueType,
        status: request.status,
        attendanceDate: request.attendanceDate,
      },
      attendanceRecord,
      changes,
      note: item.note ?? (action === "Correction Submitted" ? request.explanation : undefined),
      outcome,
    } satisfies AttendanceAuditEvent;

    previousOutcome = outcome;
    return event;
  });
}

export const hrAttendanceAuditEvents: AttendanceAuditEvent[] = hrCorrectionRequests
  .flatMap(buildEventsForRequest)
  .sort((first, second) => second.occurredAtTimestamp - first.occurredAtTimestamp);

function formatLocalAuditTimestamp(value: Date) {
  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);

  return `${datePart} · ${timePart}`;
}

function formatLocalAuditDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function createAttendanceVerifiedAuditEvent({
  record,
  previousVerification,
  previousPayrollReadiness,
  occurredAt = new Date(),
}: {
  record: HrAttendanceMonitoringRecord;
  previousVerification: string;
  previousPayrollReadiness: string;
  occurredAt?: Date;
}): AttendanceAuditEvent {
  return {
    id: `AUD-${record.id.replace("AU-EMP-", "VERIFY-")}-${occurredAt.getTime()}`,
    occurredAt: formatLocalAuditTimestamp(occurredAt),
    occurredAtDate: formatLocalAuditDate(occurredAt),
    occurredAtTimestamp: occurredAt.getTime(),
    action: "Attendance Verified",
    area: "Attendance Monitoring",
    actor: {
      name: "HR / Attendance Staff",
      role: "HR / Attendance Staff",
    },
    employee: {
      employeeId: record.employeeId,
      name: record.employeeName,
      department: record.department,
    },
    attendanceRecordId: record.id,
    correctionRequest: null,
    attendanceRecord: buildAttendanceRecord(record),
    changes: [
      {
        field: "HR Verification",
        previousValue: previousVerification,
        newValue: "Verified",
      },
      {
        field: "Payroll Readiness",
        previousValue: previousPayrollReadiness,
        newValue: "Ready for Payroll",
      },
    ],
    note: "Attendance was reviewed by HR and is now eligible for Payroll handoff.",
    outcome: "Verified",
  };
}

export function createCorrectionWorkflowAuditEvent({
  request,
  action,
  previousStatus,
  note,
  occurredAt = new Date(),
}: {
  request: HrCorrectionRequest;
  action: Exclude<AttendanceAuditAction, "Attendance Verified">;
  previousStatus: HrCorrectionRequestStatus | "No Correction Request";
  note?: string;
  occurredAt?: Date;
}): AttendanceAuditEvent {
  const outcome = mapOutcome(action);
  const changes = previousStatus === request.status
    ? []
    : [{
      field: "Correction Status",
      previousValue: previousStatus,
      newValue: request.status,
    }];

  return {
    id: `AUD-${request.id.replace("CR-", "")}-${occurredAt.getTime()}`,
    occurredAt: formatLocalAuditTimestamp(occurredAt),
    occurredAtDate: formatLocalAuditDate(occurredAt),
    occurredAtTimestamp: occurredAt.getTime(),
    action,
    area: "Correction Requests",
    actor: {
      name: "HR / Attendance Staff",
      role: "HR / Attendance Staff",
    },
    employee: {
      employeeId: request.employeeId,
      name: request.employeeName,
      department: request.department,
    },
    attendanceRecordId: request.attendanceRecordId,
    correctionRequest: {
      id: request.id,
      issueType: request.issueType,
      status: request.status,
      attendanceDate: request.attendanceDate,
    },
    attendanceRecord: buildAttendanceRecord(attendanceRecordById.get(request.attendanceRecordId)),
    changes,
    note,
    outcome,
  };
}
