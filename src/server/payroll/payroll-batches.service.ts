import "server-only";

import { formatCampusDateKeyLabel } from "@/lib/campus-time";
import {
  getEmployeePeriodId,
  listPayrollBatches,
} from "@/server/repositories/payroll-batches/payroll-batch.repository";
import type { PayrollDashboardPeriod } from "@/types/payroll-dashboard";
import type {
  PayrollBatchItemSnapshot,
  PayrollBatchesData,
} from "@/types/payroll-batches";

import { getCurrentPayrollPeriod } from "./payroll-dashboard.service";
import {
  getPayrollVerifiedAttendanceSourcesForPeriod,
  type PayrollVerifiedAttendanceSource,
} from "./payroll-verified-attendance.service";

export function isPayrollDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value;
}

export function createPayrollPeriod(
  start: string,
  end: string,
): PayrollDashboardPeriod {
  if (!isPayrollDateKey(start) || !isPayrollDateKey(end) || start > end) {
    throw new Error("A valid payroll period is required.");
  }

  return {
    start,
    end,
    label: `${formatCampusDateKeyLabel(start)} – ${formatCampusDateKeyLabel(end)}`,
  };
}

export type PayrollBatchesQuery = {
  periodStart: string;
  periodEnd: string;
};

function getEmployeePeriodIds(batches: Awaited<ReturnType<typeof listPayrollBatches>>) {
  return new Set(
    batches.flatMap((batch) => batch.includedRecords.map((record) => record.employeePeriodId)),
  );
}

export function toPayrollBatchSnapshot(
  source: PayrollVerifiedAttendanceSource,
  snapshotCreatedAt = new Date(),
): PayrollBatchItemSnapshot {
  const { item } = source;

  if (item.hrVerification.status !== "verified" || item.payrollReadiness.status !== "ready") {
    throw new Error("Only final-verified, Ready for Payroll records can be snapshotted.");
  }

  return {
    employeePeriodId: getEmployeePeriodId(item.employeeId, item.payrollPeriod.start),
    employeeId: item.employeeId,
    employeeName: item.employeeName,
    department: item.department,
    payrollPeriod: item.payrollPeriod,
    presentDays: item.attendanceSummary.presentDays,
    lateCount: item.attendanceSummary.lateCount,
    lateMinutes: item.attendanceSummary.lateMinutes,
    undertimeMinutes: item.attendanceSummary.undertimeMinutes,
    hrVerificationStatus: item.hrVerification.status,
    payrollReadiness: item.payrollReadiness.status,
    sourceAttendanceIds: source.sourceAttendanceIds,
    snapshotCreatedAt: snapshotCreatedAt.toISOString(),
  };
}

export async function getPayrollBatchesData(
  query: PayrollBatchesQuery = getDefaultPayrollBatchesQuery(),
): Promise<PayrollBatchesData> {
  const period = createPayrollPeriod(query.periodStart, query.periodEnd);
  const [batches, sources] = await Promise.all([
    listPayrollBatches(),
    getPayrollVerifiedAttendanceSourcesForPeriod(period),
  ]);
  const includedEmployeePeriodIds = getEmployeePeriodIds(batches);
  const availableRecords = sources.filter(({ item }) => (
    item.payrollReadiness.status === "ready"
    && !includedEmployeePeriodIds.has(item.id)
  ));
  const draftBatches = batches.filter((batch) => batch.status === "Draft");

  return {
    period,
    batches,
    availableRecords,
    summary: {
      draftBatches: batches.filter((batch) => batch.status === "Draft").length,
      readyBatches: batches.filter((batch) => batch.status === "Ready").length,
      submittedBatches: batches.filter((batch) => (
        batch.status === "Submitted" || batch.status === "Acknowledged"
      )).length,
      blockedBatches: batches.filter((batch) => (
        batch.status === "Blocked" || batch.status === "Failed"
      )).length,
      recordsInDrafts: draftBatches.reduce((total, batch) => total + batch.recordCount, 0),
      blockedRecords: sources.filter(({ item }) => item.payrollReadiness.status === "blocked").length,
    },
  };
}

export function getDefaultPayrollBatchesQuery(): PayrollBatchesQuery {
  const period = getCurrentPayrollPeriod();
  return {
    periodStart: period.start,
    periodEnd: period.end,
  };
}
