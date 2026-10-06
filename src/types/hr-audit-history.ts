export const auditHistoryActions = [
  "Time In recorded",
  "Time Out recorded",
  "Correction Submitted",
  "Correction Approved",
  "Correction Rejected",
] as const;

export const auditHistoryAreas = [
  "Attendance",
  "Correction Requests",
] as const;

export const auditHistoryOutcomes = [
  "Recorded",
  "Submitted",
  "Approved",
  "Rejected",
] as const;

export type HrAuditHistoryAction = typeof auditHistoryActions[number];
export type HrAuditHistoryArea = typeof auditHistoryAreas[number];
export type HrAuditHistoryOutcome = typeof auditHistoryOutcomes[number];

export type HrAuditHistoryOption = {
  value: string;
  label: string;
};
export type HrAuditHistoryChange = {
  field: string;
  previousValue: string | null;
  newValue: string | null;
};

export type HrAuditHistoryItem = {
  id: string;
  occurredAt: string;
  occurredAtDate: string;
  occurredAtTimestamp: number;
  action: HrAuditHistoryAction;
  area: HrAuditHistoryArea;
  actor: {
    displayName: string | null;
    role: string | null;
  };
  employee: {
    employeeId: string;
    displayName: string;
    department: string;
  } | null;
  attendanceRecordId: string | null;
  correctionRequest: {
    id: string;
    issueType: string;
    status: "Pending" | "Approved" | "Rejected";
    attendanceDate: string;
  } | null;
  attendanceRecord: {
    id: string;
    date: string;
    timeIn: string | null;
    timeOut: string | null;
    source: "QR";
    status: "Present" | "Completed";
  } | null;
  changes: readonly HrAuditHistoryChange[];
  note: string | null;
  outcome: HrAuditHistoryOutcome;
};

export type HrAuditHistoryQuery = {
  search: string;
  fromDate: string | null;
  toDate: string | null;
  action: HrAuditHistoryAction | null;
  area: HrAuditHistoryArea | null;
  actorRole: string | null;
  outcome: HrAuditHistoryOutcome | null;
  employeeId: string | null;
  page: number;
  pageSize: number;
};

export type HrAuditHistorySummary = {
  total: number;
  attendance: number;
  qr: number;
  corrections: number;
  approved: number;
  rejected: number;
};
