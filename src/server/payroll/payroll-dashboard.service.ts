import "server-only";

import {
  formatCampusDateKeyLabel,
  getCampusDateParts,
} from "@/lib/campus-time";
import {
  listAttendanceForReport,
} from "@/server/repositories/attendance/attendance.repository";
import {
  listAttendanceCorrectionRequests,
} from "@/server/repositories/attendance-corrections/attendance-correction.repository";
import { listEmployees } from "@/server/repositories/employees/employee.repository";
import { listPayrollBatches } from "@/server/repositories/payroll-batches/payroll-batch.repository";
import { listPayrollHandoffs } from "@/server/repositories/payroll-handoffs/payroll-handoff.repository";
import type { PayrollAlert, PayrollDashboardData } from "@/types/payroll-dashboard";

const payrollPeriodMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

type PayrollPeriod = PayrollDashboardData["period"];

export function getCurrentPayrollPeriod(now = new Date()): PayrollPeriod {
  const { year, month, day } = getCampusDateParts(now);
  const monthKey = String(month).padStart(2, "0");
  const startDay = day <= 15 ? 1 : 16;
  const endDay = day <= 15
    ? 15
    : new Date(Date.UTC(year, month, 0)).getUTCDate();
  const start = `${year}-${monthKey}-${String(startDay).padStart(2, "0")}`;
  const end = `${year}-${monthKey}-${String(endDay).padStart(2, "0")}`;
  const monthLabel = payrollPeriodMonthFormatter.format(
    new Date(`${start}T00:00:00.000Z`),
  );

  return {
    start,
    end,
    label: `${monthLabel} ${startDay}–${endDay}, ${year}`,
  };
}

export function getPayrollPeriodForStart(start: string): PayrollPeriod | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    return null;
  }

  const date = new Date(`${start}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const period = getCurrentPayrollPeriod(date);
  return period.start === start ? period : null;
}

export function getPayrollPeriodOptions(
  now = new Date(),
  count = 6,
): PayrollPeriod[] {
  const optionCount = Number.isInteger(count) && count > 0
    ? Math.min(count, 24)
    : 6;
  const periods: PayrollPeriod[] = [];
  let period = getCurrentPayrollPeriod(now);

  for (let index = 0; index < optionCount; index += 1) {
    periods.push(period);

    const previousBoundary = new Date(`${period.start}T12:00:00.000Z`);
    previousBoundary.setUTCDate(previousBoundary.getUTCDate() - 1);
    period = getCurrentPayrollPeriod(previousBoundary);
  }

  return periods;
}

function isWithinPeriod(date: string, period: PayrollPeriod) {
  return date >= period.start && date <= period.end;
}

type BlockedCase = {
  employeeId: string;
  employeeName: string;
  date: string;
  reasons: Set<string>;
};

function addBlockedReason(
  blockedCases: Map<string, BlockedCase>,
  input: {
    employeeId: string;
    employeeName: string;
    date: string;
    reason: string;
  },
) {
  const key = `${input.employeeId}:${input.date}`;
  const existing = blockedCases.get(key);

  if (existing) {
    existing.reasons.add(input.reason);
    return;
  }

  blockedCases.set(key, {
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    date: input.date,
    reasons: new Set([input.reason]),
  });
}

export async function getPayrollDashboardData(
  now = new Date(),
): Promise<PayrollDashboardData> {
  const period = getCurrentPayrollPeriod(now);
  const [employees, attendanceDocuments, correctionRequests, batches, handoffs] = await Promise.all([
    listEmployees(),
    listAttendanceForReport({
      attendanceMonth: period.start.slice(0, 7),
    }),
    listAttendanceCorrectionRequests(),
    listPayrollBatches(),
    listPayrollHandoffs(),
  ]);
  const employeesById = new Map(
    employees.map((employee) => [employee.employeeId, employee]),
  );
  const periodAttendance = attendanceDocuments.filter(({ record }) => (
    isWithinPeriod(record.attendanceDate, period)
  ));
  const periodCorrections = correctionRequests.filter((request) => (
    isWithinPeriod(request.attendanceDate, period)
  ));
  const blockedCases = new Map<string, BlockedCase>();

  for (const { record } of periodAttendance) {
    if (record.timeOut !== null) {
      continue;
    }

    const employee = employeesById.get(record.employeeId);

    addBlockedReason(blockedCases, {
      employeeId: record.employeeId,
      employeeName: employee?.displayName ?? "Employee information unavailable",
      date: record.attendanceDate,
      reason: "Time-Out is missing",
    });
  }

  for (const request of periodCorrections) {
    if (request.status !== "pending") {
      continue;
    }

    const employee = employeesById.get(request.employeeId);

    addBlockedReason(blockedCases, {
      employeeId: request.employeeId,
      employeeName: employee?.displayName ?? "Employee information unavailable",
      date: request.attendanceDate,
      reason: "Correction request is pending HR review",
    });
  }

  const alerts: PayrollAlert[] = Array.from(blockedCases.values())
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5)
    .map((blockedCase) => ({
      id: `blocked-${blockedCase.employeeId}-${blockedCase.date}`,
      message: `${blockedCase.employeeName} · ${formatCampusDateKeyLabel(blockedCase.date, "long")}: ${Array.from(blockedCase.reasons).join("; ")}.`,
      status: "Blocked",
      tone: "warning" as const,
      icon: "warning" as const,
    }));

  const periodBatches = batches.filter((batch) => (
    batch.period.start === period.start && batch.period.end === period.end
  ));
  const periodHandoffs = handoffs.filter((handoff) => (
    handoff.period.start === period.start && handoff.period.end === period.end
  ));
  const readyBatches = periodBatches.filter((batch) => (
    batch.status === "Ready" && batch.recordCount > 0 && batch.blockedCount === 0
  ));
  const failedHandoffs = periodHandoffs.filter((handoff) => handoff.transferStatus === "failed");
  const pendingHandoffs = periodHandoffs.filter((handoff) => (
    handoff.transferStatus === "submitted" && handoff.acknowledgementStatus === "pending"
  ));

  if (readyBatches.length > 0) {
    alerts.unshift({
      id: "handoff-ready",
      message: `${readyBatches.length} payroll batch${readyBatches.length === 1 ? " is" : "es are"} ready for handoff.`,
      status: "Ready",
      tone: "info" as const,
      icon: "check" as const,
    });
  }
  failedHandoffs.forEach((handoff) => alerts.push({
    id: `handoff-failed-${handoff.transferId}`,
    message: `${handoff.batchId} requires technical follow-up after a failed handoff.`,
    status: "Failed",
    tone: "danger" as const,
    icon: "warning" as const,
  }));
  if (pendingHandoffs.length > 0) {
    alerts.push({
      id: "handoff-pending",
      message: `${pendingHandoffs.length} payroll handoff${pendingHandoffs.length === 1 ? " is" : "s are"} awaiting acknowledgement.`,
      status: "Awaiting acknowledgement",
      tone: "warning" as const,
      icon: "clock" as const,
    });
  }

  const recentBatches = periodBatches.slice(0, 5).map((batch) => {
    const handoff = periodHandoffs.find((candidate) => candidate.batchId === batch.id);
    const transferStatus = handoff?.transferStatus === "failed"
      ? "Failed"
      : handoff?.acknowledgementStatus === "accepted"
        ? "Acknowledged"
        : batch.status;
    return {
      id: batch.id,
      payrollPeriod: batch.period.label,
      employees: String(batch.recordCount),
      createdBy: batch.createdBy.displayName,
      transferStatus,
      transferTone: transferStatus === "Failed" ? "danger" as const : transferStatus === "Ready" ? "info" as const : "success" as const,
    };
  });

  return {
    period,
    metrics: {
      verifiedAttendance: periodAttendance.filter(({ record }) => record.hrVerification?.status === "verified").length,
      readyForHandoff: readyBatches.length,
      blocked: blockedCases.size,
      transferred: periodHandoffs.filter((handoff) => handoff.transferStatus === "submitted").length,
      transferIssues: failedHandoffs.length,
    },
    readiness: [],
    recentBatches,
    alerts: alerts.slice(0, 5),
  };
}
