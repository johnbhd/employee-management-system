import type { Metric, StatusTone } from "@/types/ui";

export type PayrollReadinessFilter = "ready" | "blocked";
export type PayrollBatchFilter = "included" | "ready-batch" | "not-included" | "transferred";

export type PayrollVerifiedAttendanceRecord = {
  employeeName: string;
  employeeId: string;
  department: string;
  payrollPeriod: string;
  daysPresent: string;
  lateUndertime: string;
  verification: string;
  verificationTone: StatusTone;
  readiness: string;
  readinessTone: StatusTone;
  readinessFilter: PayrollReadinessFilter;
  batchStatus: string;
  batchTone: StatusTone;
  batchFilter: PayrollBatchFilter;
};

export const verifiedAttendanceSummaryMetrics: readonly Metric[] = [
  {
    label: "Verified records",
    value: "124",
    note: "HR-verified attendance",
    icon: "users",
    tone: "success",
  },
  {
    label: "Ready for payroll",
    value: "96",
    note: "Eligible for batch preparation",
    icon: "check",
    tone: "info",
  },
  {
    label: "Already added to batch",
    value: "62",
    note: "Included in current batches",
    icon: "layers",
    tone: "success",
  },
  {
    label: "Blocked records",
    value: "18",
    note: "Cannot proceed yet",
    icon: "warning",
    tone: "warning",
  },
  {
    label: "Needs follow-up",
    value: "8",
    note: "Requires HR or technical review",
    icon: "warning",
    tone: "danger",
  },
];

export const payrollVerifiedAttendanceRecords: readonly PayrollVerifiedAttendanceRecord[] = [
  {
    employeeName: "John Benedict M. Villegas",
    employeeId: "AU-EMP-2026-0418",
    department: "Information Technology",
    payrollPeriod: "Sep 1–15, 2026",
    daysPresent: "13 / 13",
    lateUndertime: "Late: 0 · Undertime: 0",
    verification: "Verified",
    verificationTone: "success",
    readiness: "Ready",
    readinessTone: "success",
    readinessFilter: "ready",
    batchStatus: "Included in batch",
    batchTone: "info",
    batchFilter: "included",
  },
  {
    employeeName: "Maria Santos",
    employeeId: "AU-EMP-2026-0194",
    department: "Operations",
    payrollPeriod: "Sep 1–15, 2026",
    daysPresent: "12 / 13",
    lateUndertime: "Late: 1 · Undertime: 15m",
    verification: "Verified",
    verificationTone: "success",
    readiness: "Ready",
    readinessTone: "success",
    readinessFilter: "ready",
    batchStatus: "Ready for batch",
    batchTone: "warning",
    batchFilter: "ready-batch",
  },
  {
    employeeName: "Robert Ong",
    employeeId: "AU-EMP-2026-0062",
    department: "Facilities",
    payrollPeriod: "Sep 1–15, 2026",
    daysPresent: "11 / 13",
    lateUndertime: "Late: 2 · Undertime: 1h 30m",
    verification: "Needs review",
    verificationTone: "warning",
    readiness: "Blocked",
    readinessTone: "danger",
    readinessFilter: "blocked",
    batchStatus: "Not included",
    batchTone: "danger",
    batchFilter: "not-included",
  },
  {
    employeeName: "Ana Reyes",
    employeeId: "AU-EMP-2026-0271",
    department: "Registrar",
    payrollPeriod: "Sep 1–15, 2026",
    daysPresent: "13 / 13",
    lateUndertime: "Late: 0 · Undertime: 0",
    verification: "Verified",
    verificationTone: "success",
    readiness: "Ready",
    readinessTone: "success",
    readinessFilter: "ready",
    batchStatus: "Transferred",
    batchTone: "success",
    batchFilter: "transferred",
  },
  {
    employeeName: "Carlos Dela Cruz",
    employeeId: "AU-EMP-2026-0520",
    department: "Human Resources",
    payrollPeriod: "Sep 1–15, 2026",
    daysPresent: "12 / 13",
    lateUndertime: "Late: 1 · Undertime: 45m",
    verification: "Verified",
    verificationTone: "success",
    readiness: "Ready",
    readinessTone: "success",
    readinessFilter: "ready",
    batchStatus: "Ready for batch",
    batchTone: "warning",
    batchFilter: "ready-batch",
  },
];

export const payrollVerifiedAttendanceDepartments = [
  "Information Technology",
  "Operations",
  "Facilities",
  "Registrar",
  "Human Resources",
] as const;
