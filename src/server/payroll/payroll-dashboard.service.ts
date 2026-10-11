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
import type { PayrollDashboardData } from "@/types/payroll-dashboard";

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
  const [employees, attendanceDocuments, correctionRequests] = await Promise.all([
    listEmployees(),
    listAttendanceForReport({
      attendanceMonth: period.start.slice(0, 7),
    }),
    listAttendanceCorrectionRequests(),
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

  const alerts = Array.from(blockedCases.values())
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5)
    .map((blockedCase) => ({
      id: `blocked-${blockedCase.employeeId}-${blockedCase.date}`,
      message: `${blockedCase.employeeName} · ${formatCampusDateKeyLabel(blockedCase.date, "long")}: ${Array.from(blockedCase.reasons).join("; ")}.`,
      status: "Blocked",
      tone: "warning" as const,
      icon: "warning" as const,
    }));

  return {
    period,
    metrics: {
      verifiedAttendance: 0,
      readyForHandoff: 0,
      blocked: blockedCases.size,
      transferred: 0,
      transferIssues: 0,
    },
    readiness: [],
    recentBatches: [],
    alerts,
  };
}
