import "server-only";

import {
  formatCampusDateKeyLabel,
  formatCampusDateTime,
} from "@/lib/campus-time";
import {
  listPrismaAttendance,
  type PrismaAttendanceView,
} from "@/server/repositories/attendance/prisma-attendance.repository";
import { listPrismaAttendanceCorrections } from "@/server/repositories/attendance-corrections/prisma-attendance-correction.repository";
import { listPayrollBatches } from "@/server/repositories/payroll-batches/payroll-batch.repository";
import type { PayrollDashboardPeriod } from "@/types/payroll-dashboard";
import type {
  PayrollVerifiedAttendanceData,
  PayrollVerifiedAttendanceItem,
  PayrollVerifiedAttendanceQuery,
  PayrollVerifiedAttendanceReason,
} from "@/types/payroll-verified-attendance";
import type { PayrollBatchStatus } from "@/types/payroll-batches";

import {
  evaluatePayrollEligibility,
  type PayrollEligibilityReason,
} from "./payroll-eligibility";
import {
  getCurrentPayrollPeriod,
  getPayrollPeriodForStart,
  getPayrollPeriodOptions,
} from "./payroll-dashboard.service";

type EmployeePeriodGroup = {
  employeeInternalId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  records: PrismaAttendanceView[];
  sourceAttendanceIds: string[];
  attendanceDates: Set<string>;
};

type BatchOwnership = {
  id: string;
  status: PayrollBatchStatus;
} | null;

export type PayrollVerifiedAttendanceSource = {
  item: PayrollVerifiedAttendanceItem;
  sourceAttendanceIds: string[];
  employeeInternalId: string;
};

function isWithinPeriod(date: string, period: PayrollDashboardPeriod) {
  return date >= period.start && date <= period.end;
}

function matchesSearch(
  employeeName: string,
  employeeId: string,
  department: string,
  search: string,
) {
  if (!search) return true;
  const normalizedSearch = search.toLowerCase();
  return [employeeName, employeeId, department]
    .some((value) => value.toLowerCase().includes(normalizedSearch));
}

async function listAttendanceForPeriod(period: PayrollDashboardPeriod) {
  const rows: PrismaAttendanceView[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const result = await listPrismaAttendance({
      fromDate: period.start,
      toDate: period.end,
      page,
      pageSize: 200,
    });
    rows.push(...result.rows);
    hasNext = result.hasNext;
    page += 1;
  }

  return rows.filter((row) => isWithinPeriod(row.attendanceDate, period));
}

async function listPendingCorrectionIds(period: PayrollDashboardPeriod) {
  const ids = new Set<string>();
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const result = await listPrismaAttendanceCorrections({
      status: "pending",
      page,
      pageSize: 100,
    });
    result.rows
      .filter((row) => isWithinPeriod(row.attendanceDate, period))
      .forEach((row) => ids.add(row.attendanceRecordId));
    hasNext = result.hasNext;
    page += 1;
  }

  return ids;
}

function getBatchPresentation(status: PayrollBatchStatus) {
  switch (status) {
    case "Draft":
      return { label: "Draft", tone: "warning" as const };
    case "Ready":
      return { label: "Ready", tone: "info" as const };
    case "Submitted":
      return { label: "Submitted", tone: "success" as const };
    case "Acknowledged":
      return { label: "Acknowledged", tone: "success" as const };
    case "Blocked":
      return { label: "Blocked", tone: "danger" as const };
    case "Failed":
      return { label: "Failed", tone: "danger" as const };
    default:
      return { label: "Not added", tone: "muted" as const };
  }
}

function withDateContext(
  reason: PayrollEligibilityReason,
  attendanceDate: string,
): PayrollVerifiedAttendanceReason {
  const needsDateContext = reason.code === "PENDING_CORRECTION"
    || reason.code === "MISSING_EFFECTIVE_TIME"
    || reason.code === "PROCESSING_INCOMPLETE"
    || reason.code === "NOT_FINAL_VERIFIED";

  return {
    ...reason,
    label: needsDateContext
      ? `${reason.label} (${formatCampusDateKeyLabel(attendanceDate)})`
      : reason.label,
  };
}

function toVerifiedAttendanceItem(
  group: EmployeePeriodGroup,
  period: PayrollDashboardPeriod,
  pendingCorrectionIds: ReadonlySet<string>,
  ownership: BatchOwnership,
): PayrollVerifiedAttendanceItem {
  const reasonsByKey = new Map<string, PayrollVerifiedAttendanceReason>();

  group.records.forEach((record) => {
    const evaluated = evaluatePayrollEligibility({
      attendanceExists: Boolean(record.id),
      employeeExists: Boolean(record.employeeInternalId && record.employeeId),
      processingComplete: record.technicalState === "COMPLETE"
        && record.processedAt !== null
        && !record.requiresReview,
      finalVerificationStatus: record.hrVerificationStatus,
      hasFinalVerificationTimestamp: record.hrVerifiedAt !== null,
      pendingCorrection: pendingCorrectionIds.has(record.id),
      hasEffectiveTimeIn: Boolean(record.timeIn),
      hasEffectiveTimeOut: Boolean(record.timeOut),
      hasRequiredIdentifier: Boolean(record.id && record.employeeId && record.employeeInternalId),
      existingBatchReference: ownership?.id ?? null,
    });

    evaluated.reasons.forEach((reason) => {
      const contextualReason = withDateContext(reason, record.attendanceDate);
      reasonsByKey.set(`${contextualReason.code}:${record.attendanceDate}`, contextualReason);
    });
  });

  const reasons = Array.from(reasonsByKey.values());
  const readinessStatus = reasons.length > 0 ? "blocked" : "ready";
  const verifiedRecords = group.records.filter((record) => (
    record.hrVerificationStatus === "verified" && record.hrVerifiedAt
  ));
  const latestVerifiedAt = verifiedRecords.reduce<string | null>((latest, record) => (
    !latest || (record.hrVerifiedAt && record.hrVerifiedAt > latest)
      ? record.hrVerifiedAt
      : latest
  ), null);
  const verificationStatus = group.records.every((record) => record.hrVerificationStatus === "verified")
    ? "verified"
    : "pending";
  const batch = ownership
    ? {
      ...getBatchPresentation(ownership.status),
      status: ownership.status as PayrollVerifiedAttendanceItem["batch"]["status"],
      batchId: ownership.id,
    }
    : {
      label: "Not added",
      tone: "muted" as const,
      status: "not-added" as const,
      batchId: null,
    };

  return {
    id: `${group.employeeId}:${period.start}`,
    employeeName: group.employeeName,
    employeeId: group.employeeId,
    department: group.department,
    payrollPeriod: period,
    attendanceSummary: {
      presentDays: group.attendanceDates.size,
      lateCount: null,
      lateMinutes: null,
      undertimeMinutes: null,
    },
    hrVerification: {
      status: verificationStatus,
      verifiedAt: latestVerifiedAt ? formatCampusDateTime(new Date(latestVerifiedAt)) : null,
    },
    payrollReadiness: {
      status: readinessStatus,
      tone: readinessStatus === "ready" ? "success" : "warning",
      reasons,
    },
    batch,
    selectable: readinessStatus === "ready" && !ownership,
  };
}

export async function getPayrollVerifiedAttendanceSourcesForPeriod(
  period: PayrollDashboardPeriod,
): Promise<PayrollVerifiedAttendanceSource[]> {
  const [attendance, pendingCorrectionIds, batches] = await Promise.all([
    listAttendanceForPeriod(period),
    listPendingCorrectionIds(period),
    listPayrollBatches(),
  ]);
  const ownershipByEmployeePeriod = new Map<string, BatchOwnership>();

  batches.forEach((batch) => {
    batch.includedRecords.forEach((record) => {
      ownershipByEmployeePeriod.set(record.employeePeriodId, {
        id: batch.id,
        status: batch.status,
      });
    });
  });

  const groups = new Map<string, EmployeePeriodGroup>();
  attendance.forEach((record) => {
    const current = groups.get(record.employeeId) ?? {
      employeeInternalId: record.employeeInternalId,
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      department: record.department,
      records: [],
      sourceAttendanceIds: [],
      attendanceDates: new Set<string>(),
    } satisfies EmployeePeriodGroup;

    current.records.push(record);
    current.sourceAttendanceIds.push(record.id);
    current.attendanceDates.add(record.attendanceDate);
    groups.set(record.employeeId, current);
  });

  return Array.from(groups.values())
    .sort((left, right) => left.employeeName.localeCompare(right.employeeName))
    .map((group) => {
      const employeePeriodId = `${group.employeeId}:${period.start}`;
      const ownership = ownershipByEmployeePeriod.get(employeePeriodId) ?? null;
      return {
        item: toVerifiedAttendanceItem(group, period, pendingCorrectionIds, ownership),
        sourceAttendanceIds: group.sourceAttendanceIds,
        employeeInternalId: group.employeeInternalId,
      };
    });
}

export async function getPayrollVerifiedAttendanceData(
  query: PayrollVerifiedAttendanceQuery,
  now = new Date(),
): Promise<PayrollVerifiedAttendanceData> {
  const period = query.periodStart
    ? getPayrollPeriodForStart(query.periodStart) ?? getCurrentPayrollPeriod(now)
    : getCurrentPayrollPeriod(now);
  const periodOptions = getPayrollPeriodOptions(now);
  if (!periodOptions.some((option) => option.start === period.start)) {
    periodOptions.unshift(period);
  }
  const sources = await getPayrollVerifiedAttendanceSourcesForPeriod(period);
  const allItems = sources.map(({ item }) => item);
  const departments = Array.from(new Set(allItems.map((item) => item.department))).sort();
  const filteredItems = allItems.filter((item) => (
    matchesSearch(item.employeeName, item.employeeId, item.department, query.search)
    && (!query.department || item.department === query.department)
    && (!query.readiness || item.payrollReadiness.status === query.readiness)
    && (!query.batch || item.batch.status === query.batch)
  ));
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
  const page = totalItems === 0 ? 1 : Math.min(query.page, totalPages);
  const startIndex = (page - 1) * query.pageSize;

  return {
    period,
    periodOptions,
    summary: {
      verifiedRecords: allItems.filter((item) => item.hrVerification.status === "verified").length,
      ready: allItems.filter((item) => item.payrollReadiness.status === "ready").length,
      includedInBatch: allItems.filter((item) => item.batch.status !== "not-added").length,
      blocked: allItems.filter((item) => item.payrollReadiness.status === "blocked").length,
      needsFollowUp: allItems.filter((item) => item.payrollReadiness.reasons.length > 0).length,
    },
    items: filteredItems.slice(startIndex, startIndex + query.pageSize),
    departments,
    pagination: {
      page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
    },
  };
}
