import type { IconName, Metric, StatusTone } from "@/types/ui";

export type PayrollReadinessRecord = {
  employeeName: string;
  employeeId: string;
  department: string;
  payrollPeriod: string;
  attendanceStatus: string;
  attendanceTone: StatusTone;
  verification: string;
  verificationTone: StatusTone;
  payrollReadiness: string;
  payrollReadinessTone: StatusTone;
  batchStatus: string;
  batchTone: StatusTone;
};

export type PayrollBatch = {
  id: string;
  payrollPeriod: string;
  employees: string;
  createdBy: string;
  transferStatus: string;
  transferTone: StatusTone;
};

export type PayrollAlert = {
  message: string;
  status: string;
  tone: StatusTone;
  icon: Extract<IconName, "warning" | "check" | "clock">;
};

export const payrollSummaryMetrics: Metric[] = [
  {
    label: "Verified attendance",
    value: "124",
    note: "Ready employee records",
    icon: "check",
    tone: "success",
  },
  {
    label: "Ready for handoff",
    value: "96",
    note: "Included in payroll preparation",
    icon: "users",
    tone: "info",
  },
  {
    label: "Pending / blocked",
    value: "18",
    note: "Awaiting review or completion",
    icon: "clock",
    tone: "warning",
  },
  {
    label: "Transferred",
    value: "5",
    note: "Batches sent to Payroll",
    icon: "arrow",
    tone: "success",
  },
  {
    label: "Transfer issues",
    value: "2",
    note: "Requires follow-up",
    icon: "warning",
    tone: "danger",
  },
  {
    label: "Current payroll period",
    value: "Sep 1–15, 2026",
    note: "Active payroll coverage",
    icon: "calendar",
    tone: "muted",
  },
];

export const payrollReadinessRecords: readonly PayrollReadinessRecord[] = [
  {
    employeeName: "John Benedict M. Villegas",
    employeeId: "AU-EMP-2026-0418",
    department: "Information Technology",
    payrollPeriod: "Sep 1–15, 2026",
    attendanceStatus: "Complete",
    attendanceTone: "success",
    verification: "Verified",
    verificationTone: "success",
    payrollReadiness: "Ready",
    payrollReadinessTone: "success",
    batchStatus: "Included in batch",
    batchTone: "success",
  },
  {
    employeeName: "Maria Santos",
    employeeId: "AU-EMP-2026-0194",
    department: "Operations",
    payrollPeriod: "Sep 1–15, 2026",
    attendanceStatus: "Complete",
    attendanceTone: "success",
    verification: "Verified",
    verificationTone: "success",
    payrollReadiness: "Ready",
    payrollReadinessTone: "success",
    batchStatus: "Ready for batch",
    batchTone: "info",
  },
  {
    employeeName: "Robert Cruz",
    employeeId: "AU-EMP-2026-0332",
    department: "Facilities",
    payrollPeriod: "Sep 1–15, 2026",
    attendanceStatus: "Missing time-out",
    attendanceTone: "warning",
    verification: "Needs review",
    verificationTone: "warning",
    payrollReadiness: "Blocked",
    payrollReadinessTone: "danger",
    batchStatus: "Not included",
    batchTone: "danger",
  },
  {
    employeeName: "Ana Reyes",
    employeeId: "AU-EMP-2026-0271",
    department: "Registrar",
    payrollPeriod: "Sep 1–15, 2026",
    attendanceStatus: "Complete",
    attendanceTone: "success",
    verification: "Verified",
    verificationTone: "success",
    payrollReadiness: "Ready",
    payrollReadinessTone: "success",
    batchStatus: "Transferred",
    batchTone: "success",
  },
];

export const payrollBatches: readonly PayrollBatch[] = [
  {
    id: "PAY-2026-0915-A",
    payrollPeriod: "Sep 1–15, 2026",
    employees: "48 employees",
    createdBy: "Maria Santos",
    transferStatus: "Transferred",
    transferTone: "success",
  },
  {
    id: "PAY-2026-0915-B",
    payrollPeriod: "Sep 1–15, 2026",
    employees: "31 employees",
    createdBy: "Maria Santos",
    transferStatus: "Ready",
    transferTone: "info",
  },
  {
    id: "PAY-2026-0915-C",
    payrollPeriod: "Sep 1–15, 2026",
    employees: "17 employees",
    createdBy: "Maria Santos",
    transferStatus: "Blocked",
    transferTone: "danger",
  },
];

export const payrollAlerts: readonly PayrollAlert[] = [
  {
    message: "3 employees cannot be included because attendance is not yet verified.",
    status: "Needs HR review",
    tone: "warning",
    icon: "warning",
  },
  {
    message: "Batch PAY-2026-0915-C has 2 blocked records due to incomplete attendance.",
    status: "Blocked",
    tone: "danger",
    icon: "warning",
  },
  {
    message: "Last payroll handoff completed successfully at 2:30 PM.",
    status: "Transferred",
    tone: "success",
    icon: "check",
  },
  {
    message: "One batch requires correction before resubmission.",
    status: "Attention needed",
    tone: "warning",
    icon: "clock",
  },
];
