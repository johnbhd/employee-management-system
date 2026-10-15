import type {
  PayrollBatchAttendanceSnapshot,
  PayrollBatchItemReadiness,
  PayrollBatchReadiness,
  PayrollBatchReadinessReason,
  PayrollBatchVerificationSnapshot,
  PayrollBatchStatus,
} from "@/types/payroll-batches";

import {
  evaluatePayrollEligibility,
  getPayrollEligibilityReason,
  type PayrollEligibilityReason,
} from "./payroll-eligibility";

export type PayrollBatchReadinessAttendanceRecord = {
  id: string;
  employeeId: string;
  attendanceDate: string;
  timeIn: string | null;
  timeOut: string | null;
  timeInSource: string | null;
  timeOutSource: string | null;
  attendanceStatus: string | null;
  hrVerificationStatus: "pending" | "verified" | null;
  hrVerifiedAt: string | null;
  hrVerifiedBySnapshot: unknown;
  technicalState: string | null;
  processedAt: string | null;
  requiresReview: boolean;
  businessStatus: string | null;
  scheduleSnapshot: unknown;
};

export type PayrollBatchReadinessItemInput = {
  id: string;
  employeeId: string;
  employeeIdSnapshot: string;
  employeeNameSnapshot: string;
  employeePeriodId: string;
  sourceAttendanceIds: string[];
  employeeExists: boolean;
  periodStart: string;
  periodEnd: string;
  sourceRecords: PayrollBatchReadinessAttendanceRecord[];
  pendingCorrectionIds: ReadonlySet<string>;
  existingBatchReference: string | null;
};

export type PayrollBatchItemSnapshotData = {
  attendanceSnapshot: PayrollBatchAttendanceSnapshot[];
  scheduleSnapshot: Record<string, unknown> | null;
  verificationSnapshot: PayrollBatchVerificationSnapshot[];
};

export type EvaluatedPayrollBatchItem = PayrollBatchItemReadiness & {
  snapshot: PayrollBatchItemSnapshotData;
};

export type EvaluatedPayrollBatchReadiness = PayrollBatchReadiness & {
  evaluatedItems: EvaluatedPayrollBatchItem[];
};

function publicItem(item: EvaluatedPayrollBatchItem): PayrollBatchItemReadiness {
  return {
    itemId: item.itemId,
    employeePeriodId: item.employeePeriodId,
    employeeName: item.employeeName,
    employeeId: item.employeeId,
    ready: item.ready,
    sourceAttendanceIds: item.sourceAttendanceIds,
    reasons: item.reasons,
  };
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addReason(
  reasons: Map<string, PayrollEligibilityReason>,
  value: PayrollEligibilityReason,
) {
  reasons.set(value.code, value);
}

function outsidePeriod(date: string, start: string, end: string) {
  return date < start || date > end;
}

function toAttendanceSnapshot(
  record: PayrollBatchReadinessAttendanceRecord,
): PayrollBatchAttendanceSnapshot {
  return {
    attendanceRecordId: record.id,
    attendanceDate: record.attendanceDate,
    effectiveTimeIn: record.timeIn,
    effectiveTimeOut: record.timeOut,
    attendanceStatus: record.attendanceStatus ?? "unknown",
    timeInSource: record.timeInSource,
    timeOutSource: record.timeOutSource,
    technicalState: record.technicalState,
    businessStatus: record.businessStatus,
  };
}

function evaluateItem(
  input: PayrollBatchReadinessItemInput,
): EvaluatedPayrollBatchItem {
  const reasons = new Map<string, PayrollEligibilityReason>();
  const attendanceSnapshot: PayrollBatchAttendanceSnapshot[] = [];
  const verificationSnapshot: PayrollBatchVerificationSnapshot[] = [];
  let scheduleSnapshot: Record<string, unknown> | null = null;

  if (input.sourceAttendanceIds.length === 0) {
    addReason(reasons, getPayrollEligibilityReason("ATTENDANCE_NOT_FOUND"));
  }

  if (!input.employeeExists) {
    addReason(reasons, getPayrollEligibilityReason("EMPLOYEE_NOT_FOUND"));
  }

  if (input.employeePeriodId !== `${input.employeeIdSnapshot}:${input.periodStart}`) {
    addReason(reasons, getPayrollEligibilityReason("MISSING_REQUIRED_IDENTIFIER"));
  }

  for (const attendanceId of input.sourceAttendanceIds) {
    const record = input.sourceRecords.find((candidate) => candidate.id === attendanceId);

    if (!record) {
      addReason(reasons, getPayrollEligibilityReason("ATTENDANCE_NOT_FOUND"));
      continue;
    }

    const evaluated = evaluatePayrollEligibility({
      attendanceExists: true,
      employeeExists: input.employeeExists && record.employeeId === input.employeeId,
      processingComplete: record.technicalState === "COMPLETE"
        && record.processedAt !== null
        && !record.requiresReview,
      finalVerificationStatus: record.hrVerificationStatus,
      hasFinalVerificationTimestamp: record.hrVerifiedAt !== null,
      pendingCorrection: input.pendingCorrectionIds.has(record.id),
      hasEffectiveTimeIn: record.timeIn !== null,
      hasEffectiveTimeOut: record.timeOut !== null,
      hasRequiredIdentifier: Boolean(record.id && record.employeeId),
      existingBatchReference: input.existingBatchReference,
    });

    evaluated.reasons.forEach((reason) => addReason(reasons, reason));

    if (outsidePeriod(record.attendanceDate, input.periodStart, input.periodEnd)) {
      addReason(reasons, getPayrollEligibilityReason("OUTSIDE_BATCH_PERIOD"));
    }

    const snapshot = toAttendanceSnapshot(record);
    attendanceSnapshot.push(snapshot);
    verificationSnapshot.push({
      attendanceRecordId: record.id,
      verifiedAt: record.hrVerifiedAt,
      verifiedBy: record.hrVerifiedBySnapshot,
    });

    if (!scheduleSnapshot && isJsonObject(record.scheduleSnapshot)) {
      scheduleSnapshot = record.scheduleSnapshot;
    }
  }

  const itemReasons = Array.from(reasons.values());

  return {
    itemId: input.id,
    employeePeriodId: input.employeePeriodId,
    employeeName: input.employeeNameSnapshot,
    employeeId: input.employeeIdSnapshot,
    ready: itemReasons.length === 0,
    sourceAttendanceIds: input.sourceAttendanceIds,
    reasons: itemReasons,
    snapshot: {
      attendanceSnapshot,
      scheduleSnapshot,
      verificationSnapshot,
    },
  };
}

export function evaluatePayrollBatchReadiness(input: {
  batchId: string;
  status: PayrollBatchStatus;
  periodStart: string;
  periodEnd: string;
  items: PayrollBatchReadinessItemInput[];
}): EvaluatedPayrollBatchReadiness {
  const reasons: PayrollBatchReadinessReason[] = [];

  if (input.status !== "Draft") {
    reasons.push({
      code: "BATCH_NOT_DRAFT",
      owner: "PAYROLL",
      label: "Only Draft Payroll batches can be frozen.",
    });
  }

  if (input.items.length === 0) {
    reasons.push({
      code: "EMPTY_BATCH",
      owner: "PAYROLL",
      label: "This Payroll batch has no attendance records.",
    });
  }

  const evaluatedItems = input.items.map((item) => evaluateItem(item));
  const eligibleItems = evaluatedItems.filter((item) => item.ready).length;
  const blockedItems = evaluatedItems.length - eligibleItems;

  return {
    batchId: input.batchId,
    status: input.status,
    ready: reasons.length === 0 && blockedItems === 0,
    totalItems: evaluatedItems.length,
    eligibleItems,
    blockedItems,
    reasons,
    items: evaluatedItems.map(publicItem),
    evaluatedItems,
  };
}
