import { Prisma } from "@prisma/client";

import type { ActorSnapshot, SourceRecord } from "./types";
import {
  actorFrom,
  arrayFrom,
  dateOnlyFrom,
  decimalValue,
  fieldOrNull,
  integerValue,
  isRecord,
  jsonObject,
  nullableString,
  nonNegativeNumber,
  periodValue,
  requiredString,
  timeFrom,
  timestampFrom,
  timestampValue,
  type UnknownRecord,
} from "./utils";

export type MappingFailure = { message: string; quarantineReason: string };

export type MappingResult<T> = { value: T } | { failure: MappingFailure };

export type MappedEmployee = {
  legacyFirestoreId: string;
  employeeId: string;
  displayName: string;
  department: string;
  position: string | null;
  employmentStatus: "active" | "inactive";
  sourceUpdatedAt: Date | null;
  syncedAt: Date | null;
  dataSource: string;
};

export type MappedSchedule = {
  legacyFirestoreId: string;
  employeeId: string;
  scheduleId: string;
  workStart: Date | null;
  workEnd: Date | null;
  breakStart: Date | null;
  breakEnd: Date | null;
  shiftLabel: string | null;
  workDays: Prisma.InputJsonValue;
  restDays: Prisma.InputJsonValue;
  workLocation: string | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  dataSource: string;
};

export type MappedUser = {
  legacyFirestoreId: string;
  firebaseUid: string;
  username: string;
  displayName: string;
  role: "admin" | "hr" | "employee" | "payroll" | "accounting";
  employeeId: string | null;
  status: "active" | "inactive" | "disabled";
};

export type MappedAttendance = {
  legacyFirestoreId: string;
  employeeId: string;
  attendanceDate: Date;
  timeIn: Date;
  timeOut: Date | null;
  timeInSource: "QR" | "BUNDY";
  timeOutSource: "QR" | "BUNDY" | null;
  timeInSourceReference: string | null;
  timeOutSourceReference: string | null;
  status: "present" | "completed";
  timeInActor: ActorSnapshot;
  timeOutActor: ActorSnapshot | null;
  hrVerification: { verifiedAt: Date; actor: ActorSnapshot } | null;
  payrollReadinessStatus: "ready" | "blocked";
  payrollReadinessReasons: Prisma.InputJsonValue | null;
  correctionMetadata: Prisma.InputJsonValue | null;
  sourceMetadata: Prisma.InputJsonValue;
  createdAt: Date;
  updatedAt: Date;
};

export type MappedCorrection = {
  legacyFirestoreId: string;
  employeeId: string;
  attendanceDate: Date;
  attendanceSourceId: string;
  issueType: "Missing Time-In" | "Missing Time-Out" | "Incorrect Time-In" | "Incorrect Time-Out" | "Time In and Time Out Correction";
  status: "pending" | "approved" | "rejected";
  reason: string;
  originalSnapshot: Prisma.InputJsonValue | null;
  requestedChanges: Prisma.InputJsonValue;
  resultingSnapshot: Prisma.InputJsonValue | null;
  changedFields: Prisma.InputJsonValue;
  evidence: Prisma.InputJsonValue;
  submittedBy: ActorSnapshot;
  reviewedBy: ActorSnapshot | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewNote: string | null;
};

export type MappedBatch = {
  legacyFirestoreId: string;
  batchReference: string;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  status: "Draft" | "Ready" | "Submitted" | "Acknowledged" | "Blocked" | "Failed";
  createdBy: ActorSnapshot;
  createdAt: Date;
  updatedAt: Date;
  submittedBy: ActorSnapshot | null;
  submittedAt: Date | null;
  recordCount: number;
  blockedCount: number;
  notes: string | null;
  includedRecords: Prisma.InputJsonValue;
};

export type MappedBatchItem = {
  legacyFirestoreId: string;
  batchSourceId: string;
  employeeId: string;
  employeePeriodId: string;
  periodStart: Date;
  periodEnd: Date;
  employeeIdSnapshot: string;
  employeeNameSnapshot: string;
  departmentSnapshot: string;
  presentDays: number;
  lateCount: number | null;
  lateMinutes: number | null;
  undertimeMinutes: number | null;
  hrVerificationStatus: "pending" | "verified";
  payrollReadinessStatus: "ready" | "blocked";
  sourceAttendanceIds: Prisma.InputJsonValue;
  snapshotCreatedAt: Date;
};

export type MappedHandoff = {
  legacyFirestoreId: string;
  batchSourceId: string;
  transferReference: string;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  submittedBy: ActorSnapshot;
  readyAt: Date;
  submittedAt: Date;
  acknowledgedAt: Date | null;
  failedAt: Date | null;
  transferStatus: "preparing" | "submitting" | "submitted" | "failed";
  acknowledgementStatus: "pending" | "accepted" | "rejected" | "not_received";
  externalReference: string | null;
  provider: string;
  failureCode: string | null;
  failureSummary: string | null;
  attemptCount: number;
  batchSummarySnapshot: Prisma.InputJsonValue;
};

export type MappedResult = {
  legacyFirestoreId: string;
  batchSourceId: string;
  handoffSourceId: string;
  resultReference: string;
  externalPayrollReference: string;
  status: "processing" | "completed" | "completed_with_issues" | "partially_completed" | "rejected" | "failed";
  provider: string;
  employeeCount: number;
  processedCount: number;
  pendingCount: number;
  rejectedCount: number;
  failedCount: number;
  payslipAvailableCount: number;
  accountingReadinessStatus: "ready" | "blocked";
  accountingReadinessReasons: Prisma.InputJsonValue | null;
  receivedAt: Date;
  processedAt: Date | null;
  completedAt: Date | null;
};

export type MappedResultItem = {
  legacyFirestoreId: string;
  resultSourceId: string;
  employeeId: string | null;
  employeeIdSnapshot: string;
  employeeNameSnapshot: string;
  departmentSnapshot: string;
  periodStart: Date;
  periodEnd: Date;
  externalEmployeeReference: string;
  externalPayrollReference: string | null;
  processingStatus: "processed" | "pending" | "rejected" | "failed";
  payslipStatus: "available" | "not_yet_available" | "unavailable";
  externalPayslipId: string | null;
  issueCode: string | null;
  issueSummary: string | null;
  processedAt: Date | null;
  releasedAt: Date | null;
};

export type MappedPayslip = {
  legacyFirestoreId: string;
  employeeId: string;
  resultItemSourceId: string | null;
  periodStart: Date;
  periodEnd: Date;
  payFrequency: string;
  monthlyBasicSalary: Prisma.Decimal | null;
  cutoffBasicPay: Prisma.Decimal | null;
  referenceDailyRate: Prisma.Decimal | null;
  basicPay: Prisma.Decimal | null;
  grossPay: Prisma.Decimal | null;
  deductions: Prisma.InputJsonValue;
  totalDeductions: Prisma.Decimal | null;
  netPay: Prisma.Decimal | null;
  status: "released" | "InProgress";
  releasedAt: Date | null;
  source: string;
  payrollReference: string;
  monthlySummary: Prisma.InputJsonValue;
};

export type MappedAccountingTransfer = {
  legacyFirestoreId: string;
  resultSourceId: string;
  batchSourceId: string;
  handoffSourceId: string;
  transferReference: string;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  externalPayrollReference: string;
  employeeCount: number;
  payrollResultStatus: MappedResult["status"];
  submittedBy: ActorSnapshot;
  submittedAt: Date;
  acknowledgedAt: Date | null;
  failedAt: Date | null;
  transferStatus: "preparing" | "submitting" | "submitted" | "failed";
  acknowledgementStatus: "pending" | "accepted" | "rejected" | "not_received";
  externalAccountingReference: string | null;
  provider: string;
  failureCode: string | null;
  failureSummary: string | null;
  attemptCount: number;
};

export type MappedAudit = {
  legacyFirestoreId: string;
  sourceCollection: string;
  eventType: string;
  action: string;
  module: string;
  actorType: "user" | "system" | "integration";
  actor: ActorSnapshot | null;
  actorUid: string | null;
  targetType: string;
  targetId: string | null;
  targetReference: string;
  targetLabel: string;
  targetSnapshot: Prisma.InputJsonValue | null;
  outcome: "Successful" | "Failed" | "Blocked";
  summary: string;
  metadata: Prisma.InputJsonValue;
  occurredAt: Date;
};

export type MappedSetting = {
  sourceId: string;
  settingKey: string;
  overrides: Prisma.InputJsonValue;
  version: number;
  updatedBy: ActorSnapshot | null;
  updatedAt: Date | null;
};

function failure(message: string): MappingFailure {
  return { message, quarantineReason: message };
}

function success<T>(value: T): MappingResult<T> {
  return { value };
}

function fail<T>(message: string): MappingResult<T> {
  return { failure: failure(message) };
}

function statusOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && allowed.includes(value as T) ? value as T : null;
}

export function mapEmployee(record: SourceRecord): MappingResult<MappedEmployee> {
  const data = record.data as UnknownRecord;
  const employeeId = requiredString(data, "employeeId", "id") ?? record.id;
  const displayName = requiredString(data, "displayName", "employee", "name");
  const department = requiredString(data, "department");
  const employmentStatus = statusOf(data.employmentStatus, ["active", "inactive"] as const);
  if (!employeeId || !displayName || !department || !employmentStatus) {
    return fail(`Employee ${record.id} is missing a valid employeeId, displayName, department, or employmentStatus.`);
  }
  return success({
    legacyFirestoreId: record.id,
    employeeId,
    displayName,
    department,
    position: nullableString(data, "position"),
    employmentStatus,
    sourceUpdatedAt: timestampFrom(data, "sourceUpdatedAt", "updatedAt"),
    syncedAt: timestampFrom(data, "syncedAt", "updatedAt"),
    dataSource: requiredString(data, "dataSource") ?? "firestore-migration",
  });
}

export function mapSchedule(record: SourceRecord): MappingResult<MappedSchedule> {
  const data = record.data as UnknownRecord;
  const employeeId = requiredString(data, "employeeId");
  const scheduleId = requiredString(data, "scheduleId") ?? record.id;
  const workDays = arrayFrom(data, "workDays");
  const restDays = arrayFrom(data, "restDays");
  if (!employeeId || !scheduleId || !workDays || !restDays) {
    return fail(`Schedule ${record.id} is missing employeeId, scheduleId, workDays, or restDays.`);
  }
  return success({
    legacyFirestoreId: record.id,
    employeeId,
    scheduleId,
    workStart: timeFrom(data, "workStart"),
    workEnd: timeFrom(data, "workEnd"),
    breakStart: timeFrom(data, "breakStart"),
    breakEnd: timeFrom(data, "breakEnd"),
    shiftLabel: nullableString(data, "shiftLabel"),
    workDays,
    restDays,
    workLocation: nullableString(data, "workLocation"),
    effectiveFrom: dateOnlyFrom(data, "effectiveFrom", "startDate"),
    effectiveTo: dateOnlyFrom(data, "effectiveTo", "endDate"),
    dataSource: requiredString(data, "dataSource") ?? "firestore-migration",
  });
}

export function mapUser(record: SourceRecord): MappingResult<MappedUser> {
  const data = record.data as UnknownRecord;
  const role = statusOf(data.role, ["admin", "hr", "employee", "payroll", "accounting"] as const);
  const status = statusOf(data.status, ["active", "inactive", "disabled"] as const);
  const username = requiredString(data, "username");
  const displayName = requiredString(data, "displayName", "name");
  if (!role || !status || !username || !displayName) {
    return fail(`User ${record.id} is missing a valid username, displayName, role, or status.`);
  }
  return success({
    legacyFirestoreId: record.id,
    firebaseUid: requiredString(data, "uid", "firebaseUid") ?? record.id,
    username,
    displayName,
    role,
    employeeId: nullableString(data, "employeeId"),
    status,
  });
}

export function mapAttendance(record: SourceRecord): MappingResult<MappedAttendance> {
  const data = record.data as UnknownRecord;
  const employeeId = requiredString(data, "employeeId");
  const attendanceDate = dateOnlyFrom(data, "attendanceDate", "date");
  const timeIn = timestampFrom(data, "timeIn");
  const status = statusOf(data.status, ["present", "completed"] as const);
  const timeInActor = actorFrom(data, "timeInOperator", "timeInActor");
  if (!employeeId || !attendanceDate || !timeIn || !status || !timeInActor) {
    return fail(`Attendance ${record.id} is missing employeeId, date, timeIn, status, or the time-in actor snapshot.`);
  }
  const timeOut = timestampFrom(data, "timeOut");
  const timeInSource = statusOf(data.timeInSource, ["QR", "BUNDY"] as const) ?? "QR";
  const timeOutSourceRaw = fieldOrNull(data, "timeOutSource");
  const timeOutSource = timeOutSourceRaw === null ? null : statusOf(timeOutSourceRaw, ["QR", "BUNDY"] as const);
  const verification = nestedVerification(data.hrVerification);
  const readiness = statusOf(data.payrollReadinessStatus ?? data.payrollReadiness, ["ready", "blocked"] as const) ?? "blocked";
  return success({
    legacyFirestoreId: record.id,
    employeeId,
    attendanceDate,
    timeIn,
    timeOut,
    timeInSource,
    timeOutSource: timeOut ? timeOutSource ?? timeInSource : null,
    timeInSourceReference: nullableString(data, "timeInSourceReference", "timeInReference"),
    timeOutSourceReference: nullableString(data, "timeOutSourceReference", "timeOutReference"),
    status,
    timeInActor,
    timeOutActor: actorFrom(data, "timeOutOperator", "timeOutActor"),
    hrVerification: verification,
    payrollReadinessStatus: readiness,
    payrollReadinessReasons: fieldOrNull(data, "payrollReadinessReasons") === null ? null : jsonObject(fieldOrNull(data, "payrollReadinessReasons")),
    correctionMetadata: fieldOrNull(data, "correction") === null ? null : jsonObject(fieldOrNull(data, "correction")),
    sourceMetadata: jsonObject({
      sourceCollection: record.collection,
      sourceDocumentId: record.id,
      sourceAttendanceDate: requiredString(data, "attendanceDate", "date"),
      sourceTimeInSource: timeInSource,
      sourceTimeOutSource: timeOutSource,
      sourcePayrollReadiness: fieldOrNull(data, "payrollReadinessStatus", "payrollReadiness"),
    }),
    createdAt: timestampFrom(data, "createdAt", "timeIn") ?? timeIn,
    updatedAt: timestampFrom(data, "updatedAt", "createdAt", "timeIn") ?? timeIn,
  });
}

function nestedVerification(value: unknown): MappedAttendance["hrVerification"] {
  if (!isRecord(value) || value.status !== "verified") return null;
  const verifiedAt = timestampValue(value.verifiedAt);
  const actor = actorFrom(value, "verifiedBy", "actor");
  return verifiedAt && actor ? { verifiedAt, actor } : null;
}

export function mapCorrection(record: SourceRecord): MappingResult<MappedCorrection> {
  const data = record.data as UnknownRecord;
  const employeeId = requiredString(data, "employeeId");
  const attendanceDate = dateOnlyFrom(data, "attendanceDate", "date");
  const issueType = statusOf(data.issueType, ["Missing Time-In", "Missing Time-Out", "Incorrect Time-In", "Incorrect Time-Out", "Time In and Time Out Correction"] as const);
  const status = statusOf(data.status, ["pending", "approved", "rejected"] as const);
  const reason = requiredString(data, "reason");
  const submittedBy = actorFrom(data, "submittedBy", "submittedByActor");
  const submittedAt = timestampFrom(data, "submittedAt");
  const reviewedBy = actorFrom(data, "reviewedBy", "reviewedByActor");
  const reviewedAt = timestampFrom(data, "reviewedAt");
  if (!employeeId || !attendanceDate || !issueType || !status || !reason || !submittedBy || !submittedAt || (status === "pending" && (reviewedBy || reviewedAt)) || (status !== "pending" && (!reviewedBy || !reviewedAt))) {
    return fail(`Correction ${record.id} is missing employee/date/issue/status/reason/submittedBy data.`);
  }
  return success({
    legacyFirestoreId: record.id,
    employeeId,
    attendanceDate,
    attendanceSourceId: requiredString(data, "attendanceRecordId", "attendanceId") ?? `${employeeId}_${attendanceDate.toISOString().slice(0, 10)}`,
    issueType,
    status,
    reason,
    originalSnapshot: fieldOrNull(data, "originalAttendance", "originalSnapshot") === null ? null : jsonObject(fieldOrNull(data, "originalAttendance", "originalSnapshot")),
    requestedChanges: jsonObject(fieldOrNull(data, "requestedChanges") ?? {}),
    resultingSnapshot: fieldOrNull(data, "resultingAttendance", "resultingSnapshot") === null ? null : jsonObject(fieldOrNull(data, "resultingAttendance", "resultingSnapshot")),
    changedFields: jsonValueArray(data.changedFields),
    evidence: jsonValueArray(data.evidence),
    submittedBy,
    reviewedBy,
    submittedAt,
    reviewedAt,
    reviewNote: nullableString(data, "reviewNote"),
  });
}

function jsonValueArray(value: unknown): Prisma.InputJsonValue {
  return Array.isArray(value) ? value.map((item) => jsonObject(item)) : [];
}

export function mapBatch(record: SourceRecord): MappingResult<MappedBatch> {
  const data = record.data as UnknownRecord;
  const period = periodValue(data);
  const status = statusOf(data.status, ["Draft", "Ready", "Submitted", "Acknowledged", "Blocked", "Failed"] as const);
  const createdBy = actorFrom(data, "createdBy");
  const createdAt = timestampFrom(data, "createdAt");
  const updatedAt = timestampFrom(data, "updatedAt", "createdAt");
  const recordCount = integerValue(data, "recordCount");
  const blockedCount = integerValue(data, "blockedCount");
  if (!period || !status || !createdBy || !createdAt || !updatedAt || recordCount === null || blockedCount === null || !Array.isArray(data.includedRecords)) {
    return fail(`Payroll batch ${record.id} is missing a valid period, status, actor, timestamps, or counts.`);
  }
  return success({
    legacyFirestoreId: record.id,
    batchReference: requiredString(data, "batchReference", "batchId") ?? record.id,
    periodStart: period.start,
    periodEnd: period.end,
    periodLabel: period.label,
    status,
    createdBy,
    createdAt,
    updatedAt,
    submittedBy: actorFrom(data, "submittedBy"),
    submittedAt: timestampFrom(data, "submittedAt"),
    recordCount,
    blockedCount,
    notes: nullableString(data, "notes"),
    includedRecords: jsonValueArray(data.includedRecords),
  });
}

export function mapBatchItem(record: SourceRecord, batchSourceId: string): MappingResult<MappedBatchItem> {
  const data = record.data as UnknownRecord;
  const period = periodValue(data);
  const employeeId = requiredString(data, "employeeId");
  const employeePeriodId = requiredString(data, "employeePeriodId") ?? record.id;
  const employeeNameSnapshot = requiredString(data, "employeeName", "employeeNameSnapshot");
  const departmentSnapshot = requiredString(data, "department", "departmentSnapshot");
  const presentDays = nonNegativeNumber(data, "presentDays");
  const snapshotCreatedAt = timestampFrom(data, "snapshotCreatedAt", "createdAt");
  const hrVerificationStatus = statusOf(data.hrVerificationStatus, ["pending", "verified"] as const) ?? "verified";
  const payrollReadinessStatus = statusOf(data.payrollReadinessStatus ?? data.payrollReadiness, ["ready", "blocked"] as const) ?? "ready";
  if (!period || !employeeId || !employeeNameSnapshot || !departmentSnapshot || presentDays === null || !snapshotCreatedAt) {
    return fail(`Payroll batch item ${record.id} is missing employee, period, snapshot, or present-day data.`);
  }
  return success({
    legacyFirestoreId: record.id,
    batchSourceId,
    employeeId,
    employeePeriodId,
    periodStart: period.start,
    periodEnd: period.end,
    employeeIdSnapshot: requiredString(data, "employeeIdSnapshot", "employeeId") ?? employeeId,
    employeeNameSnapshot,
    departmentSnapshot,
    presentDays,
    lateCount: nonNegativeNumber(data, "lateCount"),
    lateMinutes: nonNegativeNumber(data, "lateMinutes"),
    undertimeMinutes: nonNegativeNumber(data, "undertimeMinutes"),
    hrVerificationStatus,
    payrollReadinessStatus,
    sourceAttendanceIds: jsonValueArray(data.sourceAttendanceIds),
    snapshotCreatedAt,
  });
}

export function mapHandoff(record: SourceRecord): MappingResult<MappedHandoff> {
  const data = record.data as UnknownRecord;
  const period = periodValue(data);
  const submittedBy = actorFrom(data, "submittedBy");
  const submittedAt = timestampFrom(data, "submittedAt");
  const readyAt = timestampFrom(data, "readyAt");
  const status = statusOf(data.transferStatus, ["preparing", "submitting", "submitted", "failed"] as const);
  const acknowledgementStatus = statusOf(data.acknowledgementStatus, ["pending", "accepted", "rejected", "not_received"] as const);
  const attemptCount = integerValue(data, "attemptCount");
  const batchSourceId = requiredString(data, "batchId");
  if (!period || !submittedBy || !submittedAt || !readyAt || !status || !acknowledgementStatus || attemptCount === null || !batchSourceId) {
    return fail(`Payroll handoff ${record.id} is missing period, batch, actor, status, or timestamp data.`);
  }
  return success({
    legacyFirestoreId: record.id,
    batchSourceId,
    transferReference: requiredString(data, "transferId", "transferReference") ?? record.id,
    periodStart: period.start,
    periodEnd: period.end,
    periodLabel: period.label,
    submittedBy,
    readyAt,
    submittedAt,
    acknowledgedAt: timestampFrom(data, "acknowledgedAt"),
    failedAt: timestampFrom(data, "failedAt"),
    transferStatus: status,
    acknowledgementStatus,
    externalReference: nullableString(data, "externalReference"),
    provider: requiredString(data, "provider") ?? "unknown",
    failureCode: nullableString(data, "failureCode"),
    failureSummary: nullableString(data, "failureSummary"),
    attemptCount,
    batchSummarySnapshot: jsonObject(fieldOrNull(data, "batchSummary") ?? {}),
  });
}

export function mapResult(record: SourceRecord): MappingResult<MappedResult> {
  const data = record.data as UnknownRecord;
  const period = periodValue(data);
  const batchSourceId = requiredString(data, "batchId");
  const handoffSourceId = requiredString(data, "transferId", "handoffId");
  const status = statusOf(data.status, ["processing", "completed", "completed_with_issues", "partially_completed", "rejected", "failed"] as const);
  const receivedAt = timestampFrom(data, "receivedAt", "createdAt");
  const employeeCount = integerValue(data, "employeeCount");
  const processedCount = integerValue(data, "processedCount");
  const pendingCount = integerValue(data, "pendingCount");
  const rejectedCount = integerValue(data, "rejectedCount");
  const failedCount = integerValue(data, "failedCount");
  const payslipAvailableCount = integerValue(data, "payslipAvailableCount");
  if (!period || !batchSourceId || !handoffSourceId || !status || !receivedAt || employeeCount === null || processedCount === null || pendingCount === null || rejectedCount === null || failedCount === null || payslipAvailableCount === null) {
    return fail(`Payroll result ${record.id} is missing lineage, period, status, timestamp, or count data.`);
  }
  return success({
    legacyFirestoreId: record.id,
    batchSourceId,
    handoffSourceId,
    resultReference: requiredString(data, "resultId", "resultReference") ?? record.id,
    externalPayrollReference: requiredString(data, "externalPayrollReference") ?? record.id,
    status,
    provider: requiredString(data, "provider") ?? "unknown",
    employeeCount,
    processedCount,
    pendingCount,
    rejectedCount,
    failedCount,
    payslipAvailableCount,
    accountingReadinessStatus: statusOf(data.accountingReadinessStatus, ["ready", "blocked"] as const) ?? "blocked",
    accountingReadinessReasons: fieldOrNull(data, "accountingReadinessReasons") === null ? null : jsonObject(fieldOrNull(data, "accountingReadinessReasons")),
    receivedAt,
    processedAt: timestampFrom(data, "processedAt"),
    completedAt: timestampFrom(data, "completedAt"),
  });
}

export function mapResultItem(record: SourceRecord, resultSourceId: string): MappingResult<MappedResultItem> {
  const data = record.data as UnknownRecord;
  const period = periodValue(data);
  const employeeIdSnapshot = requiredString(data, "employeeId", "employeeIdSnapshot");
  const employeeNameSnapshot = requiredString(data, "employeeName", "employeeNameSnapshot");
  const departmentSnapshot = requiredString(data, "department", "departmentSnapshot");
  const processingStatus = statusOf(data.processingStatus, ["processed", "pending", "rejected", "failed"] as const);
  const payslipStatus = statusOf(data.payslipStatus, ["available", "not_yet_available", "unavailable"] as const);
  if (!period || !employeeIdSnapshot || !employeeNameSnapshot || !departmentSnapshot || !processingStatus || !payslipStatus) {
    return fail(`Payroll result item ${record.id} is missing period, employee snapshot, or processing state.`);
  }
  return success({
    legacyFirestoreId: record.id,
    resultSourceId,
    employeeId: nullableString(data, "employeeId"),
    employeeIdSnapshot,
    employeeNameSnapshot,
    departmentSnapshot,
    periodStart: period.start,
    periodEnd: period.end,
    externalEmployeeReference: requiredString(data, "externalEmployeeReference") ?? employeeIdSnapshot,
    externalPayrollReference: nullableString(data, "externalPayrollReference"),
    processingStatus,
    payslipStatus,
    externalPayslipId: nullableString(data, "payslipId", "externalPayslipId"),
    issueCode: nullableString(data, "issueCode"),
    issueSummary: nullableString(data, "issueSummary"),
    processedAt: timestampFrom(data, "processedAt"),
    releasedAt: timestampFrom(data, "releasedAt"),
  });
}

export function mapPayslip(record: SourceRecord): MappingResult<MappedPayslip> {
  const data = record.data as UnknownRecord;
  const employeeId = requiredString(data, "employeeId");
  const periodStart = dateOnlyFrom(data, "periodStart");
  const periodEnd = dateOnlyFrom(data, "periodEnd");
  const status = data.status === "in-progress" ? "InProgress" : statusOf(data.status, ["released"] as const);
  const payFrequency = requiredString(data, "payFrequency");
  const payrollReference = requiredString(data, "payrollReference", "id") ?? record.id;
  if (!employeeId || !periodStart || !periodEnd || !status || !payFrequency || !payrollReference) {
    return fail(`Payslip ${record.id} is missing employee, period, pay frequency, reference, or status data.`);
  }
  return success({
    legacyFirestoreId: record.id,
    employeeId,
    resultItemSourceId: nullableString(data, "resultItemId", "payslipId"),
    periodStart,
    periodEnd,
    payFrequency,
    monthlyBasicSalary: decimalValue(fieldOrNull(data, "monthlyBasicSalary")),
    cutoffBasicPay: decimalValue(fieldOrNull(data, "cutoffBasicPay")),
    referenceDailyRate: decimalValue(fieldOrNull(data, "referenceDailyRate")),
    basicPay: decimalValue(fieldOrNull(data, "basicPay")),
    grossPay: decimalValue(fieldOrNull(data, "grossPay")),
    deductions: jsonValueArray(data.deductions),
    totalDeductions: decimalValue(fieldOrNull(data, "totalDeductions")),
    netPay: decimalValue(fieldOrNull(data, "netPay")),
    status,
    releasedAt: timestampFrom(data, "releasedAt"),
    source: requiredString(data, "source") ?? "firestore-migration",
    payrollReference,
    monthlySummary: jsonObject(fieldOrNull(data, "monthlySummary") ?? {}),
  });
}

export function mapAccountingTransfer(record: SourceRecord): MappingResult<MappedAccountingTransfer> {
  const data = record.data as UnknownRecord;
  const period = periodValue(data);
  const resultSourceId = requiredString(data, "payrollResultId", "resultId");
  const batchSourceId = requiredString(data, "payrollBatchId", "batchId");
  const handoffSourceId = requiredString(data, "payrollHandoffId", "handoffId", "transferId");
  const submittedBy = actorFrom(data, "submittedBy");
  const submittedAt = timestampFrom(data, "submittedAt");
  const transferStatus = statusOf(data.transferStatus, ["preparing", "submitting", "submitted", "failed"] as const);
  const acknowledgementStatus = statusOf(data.acknowledgementStatus, ["pending", "accepted", "rejected", "not_received"] as const);
  const payrollResultStatus = statusOf(data.payrollResultStatus, ["processing", "completed", "completed_with_issues", "partially_completed", "rejected", "failed"] as const);
  const employeeCount = integerValue(data, "employeeCount");
  const attemptCount = integerValue(data, "attemptCount");
  if (!period || !resultSourceId || !batchSourceId || !handoffSourceId || !submittedBy || !submittedAt || !transferStatus || !acknowledgementStatus || !payrollResultStatus || employeeCount === null || attemptCount === null) {
    return fail(`Accounting transfer ${record.id} is missing lineage, period, actor, status, or count data.`);
  }
  return success({
    legacyFirestoreId: record.id,
    resultSourceId,
    batchSourceId,
    handoffSourceId,
    transferReference: requiredString(data, "transferId", "transferReference") ?? record.id,
    periodStart: period.start,
    periodEnd: period.end,
    periodLabel: period.label,
    externalPayrollReference: requiredString(data, "externalPayrollReference") ?? resultSourceId,
    employeeCount,
    payrollResultStatus,
    submittedBy,
    submittedAt,
    acknowledgedAt: timestampFrom(data, "acknowledgedAt"),
    failedAt: timestampFrom(data, "failedAt"),
    transferStatus,
    acknowledgementStatus,
    externalAccountingReference: nullableString(data, "externalAccountingReference"),
    provider: requiredString(data, "provider") ?? "unknown",
    failureCode: nullableString(data, "failureCode"),
    failureSummary: nullableString(data, "failureSummary"),
    attemptCount,
  });
}

export function mapAudit(record: SourceRecord): MappingResult<MappedAudit> {
  const data = record.data as UnknownRecord;
  const actor = actorFrom(data, "actor");
  const target = isRecord(data.target) ? data.target : null;
  const occurredAt = timestampFrom(data, "occurredAt", "createdAt");
  const action = requiredString(data, "action") ?? record.collection;
  const moduleName = requiredString(data, "module") ?? "Migrated Firestore Event";
  if (!occurredAt) return fail(`Audit event ${record.id} is missing occurredAt.`);
  const targetType = requiredString(target ?? {}, "type") ?? "legacy_event";
  const targetId = target ? nullableString(target, "id") : nullableString(data, "targetId");
  const targetReference = target ? requiredString(target, "reference", "id") : requiredString(data, "targetReference", "targetId");
  const targetLabel = target ? requiredString(target, "label", "reference", "id") : requiredString(data, "targetLabel", "targetReference", "targetId");
  if (!targetReference || !targetLabel) return fail(`Audit event ${record.id} is missing a target reference or label.`);
  const actorType = actor?.role === "system" ? "system" : actor?.role === "integration" ? "integration" : "user";
  return success({
    legacyFirestoreId: record.id,
    sourceCollection: record.collection,
    eventType: requiredString(data, "eventType") ?? `legacy.${record.collection}.${action}`,
    action,
    module: moduleName,
    actorType,
    actor,
    actorUid: actor?.uid ?? nullableString(data, "actorUid"),
    targetType,
    targetId,
    targetReference,
    targetLabel,
    targetSnapshot: target ? jsonObject(target) : null,
    outcome: data.outcome === "Failed" || data.outcome === "failed" ? "Failed" : data.outcome === "Blocked" || data.outcome === "blocked" ? "Blocked" : "Successful",
    summary: requiredString(data, "summary") ?? action,
    metadata: jsonObject(fieldOrNull(data, "metadata") ?? {}),
    occurredAt,
  });
}

export function mapSetting(record: SourceRecord): MappingResult<MappedSetting> {
  const data = record.data as UnknownRecord;
  const settingKey = requiredString(data, "settingKey") ?? (record.id === "runtime" ? "runtime" : null);
  const version = integerValue(data, "version") ?? 0;
  if (!settingKey || !isRecord(data.overrides)) return fail(`System setting ${record.id} is missing a setting key or overrides object.`);
  return success({
    sourceId: record.id,
    settingKey,
    overrides: jsonObject(data.overrides),
    version,
    updatedBy: actorFrom(data, "updatedBy", "updatedByActor"),
    updatedAt: timestampFrom(data, "updatedAt", "createdAt"),
  });
}
