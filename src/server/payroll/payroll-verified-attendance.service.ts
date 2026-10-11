import "server-only";

import {
  formatCampusDateKeyLabel,
  formatCampusDateTime,
} from "@/lib/campus-time";
import {
  listAttendanceForReport,
  type StoredQrAttendanceRecord,
} from "@/server/repositories/attendance/attendance.repository";
import { listAttendanceCorrectionRequests } from "@/server/repositories/attendance-corrections/attendance-correction.repository";
import { listEmployees } from "@/server/repositories/employees/employee.repository";
import type { EmployeeReference } from "@/types/employee";
import type { PayrollDashboardPeriod } from "@/types/payroll-dashboard";
import type {
  PayrollVerifiedAttendanceData,
  PayrollVerifiedAttendanceItem,
  PayrollVerifiedAttendanceQuery,
} from "@/types/payroll-verified-attendance";

import { getCurrentPayrollPeriod } from "./payroll-dashboard.service";

type AttendanceDocument = Awaited<ReturnType<typeof listAttendanceForReport>>[number];

type EmployeePeriodGroup = {
  employee: EmployeeReference;
  records: StoredQrAttendanceRecord[];
  attendanceDates: Set<string>;
  verifiedAt: Date | null;
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
  if (!search) {
    return true;
  }

  const normalizedSearch = search.toLowerCase();

  return [employeeName, employeeId, department]
    .some((value) => value.toLowerCase().includes(normalizedSearch));
}

function getReadinessReasons(
  records: readonly StoredQrAttendanceRecord[],
  pendingCorrectionDates: ReadonlySet<string>,
) {
  const reasons = new Set<string>();

  records.forEach((record) => {
    if (record.timeOut === null) {
      reasons.add(`Missing Time-Out on ${formatCampusDateKeyLabel(record.attendanceDate)}`);
    }

    if (pendingCorrectionDates.has(record.attendanceDate)) {
      reasons.add(`Pending correction on ${formatCampusDateKeyLabel(record.attendanceDate)}`);
    }
  });

  return Array.from(reasons);
}

function toVerifiedAttendanceItem(
  group: EmployeePeriodGroup,
  period: PayrollDashboardPeriod,
  pendingCorrectionDates: ReadonlySet<string>,
): PayrollVerifiedAttendanceItem {
  const reasons = getReadinessReasons(group.records, pendingCorrectionDates);
  const readinessStatus = reasons.length > 0 ? "blocked" : "ready";

  return {
    id: `${group.employee.employeeId}:${period.start}`,
    employeeName: group.employee.displayName,
    employeeId: group.employee.employeeId,
    department: group.employee.department,
    payrollPeriod: period,
    attendanceSummary: {
      presentDays: group.attendanceDates.size,
      lateCount: null,
      lateMinutes: null,
      undertimeMinutes: null,
    },
    hrVerification: {
      status: "verified",
      verifiedAt: group.verifiedAt ? formatCampusDateTime(group.verifiedAt) : null,
    },
    payrollReadiness: {
      status: readinessStatus,
      tone: readinessStatus === "ready" ? "success" : "warning",
      reasons,
    },
    batch: {
      status: "not-added",
      label: "Not added",
      tone: "muted",
      batchId: null,
    },
    selectable: readinessStatus === "ready",
  };
}
function getVerifiedAttendanceDocuments(
  documents: readonly AttendanceDocument[],
  period: PayrollDashboardPeriod,
) {
  return documents.filter(({ record }) => (
    isWithinPeriod(record.attendanceDate, period)
    && record.hrVerification?.status === "verified"
  ));
}

function groupVerifiedAttendance(
  documents: readonly AttendanceDocument[],
  employeesById: ReadonlyMap<string, EmployeeReference>,
) {
  const groups = new Map<string, EmployeePeriodGroup>();

  documents.forEach(({ record }) => {
    const employee = employeesById.get(record.employeeId);

    if (!employee) {
      return;
    }

    const current = groups.get(employee.employeeId) ?? {
      employee,
      records: [],
      attendanceDates: new Set<string>(),
      verifiedAt: null,
    } satisfies EmployeePeriodGroup;

    current.records.push(record);
    current.attendanceDates.add(record.attendanceDate);

    if (
      record.hrVerification
      && (!current.verifiedAt
        || record.hrVerification.verifiedAt.toMillis() > current.verifiedAt.getTime())
    ) {
      current.verifiedAt = record.hrVerification.verifiedAt.toDate();
    }

    groups.set(employee.employeeId, current);
  });

  return Array.from(groups.values());
}

export async function getPayrollVerifiedAttendanceData(
  query: PayrollVerifiedAttendanceQuery,
  now = new Date(),
): Promise<PayrollVerifiedAttendanceData> {
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
  const pendingCorrectionsByEmployee = new Map<string, Set<string>>();

  correctionRequests
    .filter((request) => request.status === "pending")
    .filter((request) => isWithinPeriod(request.attendanceDate, period))
    .forEach((request) => {
      const dates = pendingCorrectionsByEmployee.get(request.employeeId) ?? new Set<string>();

      dates.add(request.attendanceDate);
      pendingCorrectionsByEmployee.set(request.employeeId, dates);
    });

  const verifiedDocuments = getVerifiedAttendanceDocuments(
    attendanceDocuments,
    period,
  );
  const allItems = groupVerifiedAttendance(verifiedDocuments, employeesById)
    .sort((left, right) => left.employee.displayName.localeCompare(right.employee.displayName))
    .map((group) => toVerifiedAttendanceItem(
      group,
      period,
      pendingCorrectionsByEmployee.get(group.employee.employeeId) ?? new Set<string>(),
    ));
  const filteredItems = allItems.filter((item) => (
    matchesSearch(
      item.employeeName,
      item.employeeId,
      item.department,
      query.search,
    )
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
    summary: {
      verifiedRecords: allItems.length,
      ready: allItems.filter((item) => item.payrollReadiness.status === "ready").length,
      includedInBatch: 0,
      blocked: allItems.filter((item) => item.payrollReadiness.status === "blocked").length,
      needsFollowUp: allItems.filter((item) => item.payrollReadiness.reasons.length > 0).length,
    },
    items: filteredItems.slice(startIndex, startIndex + query.pageSize),
    departments: Array.from(new Set(employees.map((employee) => employee.department))).sort(),
    pagination: {
      page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
    },
  };
}
