import type { StatusTone } from "@/types/ui";

export type PayrollStatus = {
  label: string;
  tone: StatusTone;
};

export type PayrollReadyRecord = {
  employeeId: string;
  employee: string;
  department: string;
  payrollPeriod: string;
  attendanceStatus: PayrollStatus;
  verificationStatus: PayrollStatus;
  readinessStatus: PayrollStatus;
  transferStatus: PayrollStatus;
};

export type PayrollFieldMapping = {
  sourceField: string;
  targetField: string;
  status: string;
  tone: StatusTone;
};

export type PayrollTransferBatch = {
  id: string;
  payrollPeriod: string;
  employeeCount: number;
  recordCount: number;
  preparedAt: string;
  transferStatus: PayrollStatus;
  acknowledgementStatus: PayrollStatus;
};

export type BlockedPayrollRecord = {
  employeeId: string;
  employee: string;
  issue: string;
  attendanceStatus: PayrollStatus;
  reviewStatus: PayrollStatus;
  readinessStatus: PayrollStatus;
};

export type FailedPayrollTransfer = {
  batchId: string;
  timestamp: string;
  recordCount: number;
  failureType: string;
  status: PayrollStatus;
};

export type PayrollHistoryEvent = {
  timestamp: string;
  batchId: string;
  payrollPeriod: string;
  recordCount: number;
  operation: string;
  status: PayrollStatus;
  details: string;
};

export type PayrollValidationCheck = {
  label: string;
  detail: string;
  status: "Passed" | "Warning" | "Failed";
  tone: StatusTone;
};

export const payrollReadyRecords: readonly PayrollReadyRecord[] = [
  {
    employeeId: "AU-EMP-2026-0418",
    employee: "John Benedict M. Villegas",
    department: "Information Technology",
    payrollPeriod: "Sep 1–15, 2026",
    attendanceStatus: { label: "Processed", tone: "info" },
    verificationStatus: { label: "Verified", tone: "success" },
    readinessStatus: { label: "Ready", tone: "success" },
    transferStatus: { label: "Pending Transfer", tone: "warning" },
  },
  {
    employeeId: "AU-EMP-2026-0194",
    employee: "Maria Santos",
    department: "Human Resources",
    payrollPeriod: "Sep 1–15, 2026",
    attendanceStatus: { label: "Processed", tone: "info" },
    verificationStatus: { label: "Verified", tone: "success" },
    readinessStatus: { label: "Ready", tone: "success" },
    transferStatus: { label: "Transferred", tone: "success" },
  },
  {
    employeeId: "AU-EMP-2026-0332",
    employee: "Robert Cruz",
    department: "Administration",
    payrollPeriod: "Sep 1–15, 2026",
    attendanceStatus: { label: "Needs Review", tone: "warning" },
    verificationStatus: { label: "Pending", tone: "warning" },
    readinessStatus: { label: "Blocked", tone: "danger" },
    transferStatus: { label: "Not Sent", tone: "muted" },
  },
  {
    employeeId: "AU-EMP-2026-0177",
    employee: "Ana Reyes",
    department: "Office Support",
    payrollPeriod: "Sep 1–15, 2026",
    attendanceStatus: { label: "Processed", tone: "info" },
    verificationStatus: { label: "Verified", tone: "success" },
    readinessStatus: { label: "Ready", tone: "success" },
    transferStatus: { label: "Transferred", tone: "success" },
  },
];

export const payrollValidationChecks: readonly PayrollValidationCheck[] = [
  { label: "Employee ID present", detail: "Required identifier is available.", status: "Passed", tone: "success" },
  {
    label: "Employee matched with HRPS",
    detail: "Prototype HRPS reference match completed.",
    status: "Passed",
    tone: "success",
  },
  { label: "Attendance verified", detail: "Only verified records can continue.", status: "Passed", tone: "success" },
  {
    label: "Required attendance fields complete",
    detail: "Time and source completeness is still reviewed.",
    status: "Warning",
    tone: "warning",
  },
  {
    label: "Duplicate transfer check",
    detail: "Acknowledged records are checked before batching.",
    status: "Passed",
    tone: "success",
  },
  {
    label: "Payroll period assigned",
    detail: "Production cutoff ownership is To Be Confirmed.",
    status: "Warning",
    tone: "warning",
  },
  {
    label: "Payload structure valid",
    detail: "Prototype field shape is ready for review.",
    status: "Passed",
    tone: "success",
  },
];

export const payrollFieldMappings: readonly PayrollFieldMapping[] = [
  { sourceField: "Employee ID", targetField: "employee_id", status: "Mapped", tone: "success" },
  { sourceField: "Attendance date", targetField: "attendance_date", status: "Mapped", tone: "success" },
  { sourceField: "Time in / Time out", targetField: "time_in / time_out", status: "Mapped", tone: "success" },
  { sourceField: "Attendance source", targetField: "attendance_source", status: "Mapped", tone: "success" },
  { sourceField: "Verification status", targetField: "verification_status", status: "Mapped", tone: "success" },
  {
    sourceField: "Late / undertime minutes",
    targetField: "late_minutes / undertime_minutes",
    status: "To Be Confirmed",
    tone: "warning",
  },
  {
    sourceField: "Overtime / leave status",
    targetField: "overtime / leave_status",
    status: "To Be Confirmed",
    tone: "warning",
  },
];

export const transferBatches: readonly PayrollTransferBatch[] = [
  {
    id: "PAY-2026-09-A",
    payrollPeriod: "Sep 1–15, 2026",
    employeeCount: 116,
    recordCount: 232,
    preparedAt: "Sep 23, 2026 · 10:42 AM",
    transferStatus: { label: "Successful", tone: "success" },
    acknowledgementStatus: { label: "Acknowledged", tone: "success" },
  },
  {
    id: "PAY-2026-09-B",
    payrollPeriod: "Sep 1–15, 2026",
    employeeCount: 8,
    recordCount: 16,
    preparedAt: "Sep 23, 2026 · 10:40 AM",
    transferStatus: { label: "Failed", tone: "danger" },
    acknowledgementStatus: { label: "Not Acknowledged", tone: "danger" },
  },
  {
    id: "PAY-2026-09-C",
    payrollPeriod: "Sep 1–15, 2026",
    employeeCount: 4,
    recordCount: 8,
    preparedAt: "Sep 23, 2026 · 10:35 AM",
    transferStatus: { label: "Queued", tone: "warning" },
    acknowledgementStatus: { label: "Pending", tone: "warning" },
  },
];

export const blockedPayrollRecords: readonly BlockedPayrollRecord[] = [
  {
    employeeId: "AU-EMP-2026-0332",
    employee: "Robert Cruz",
    issue: "Missing Time-Out",
    attendanceStatus: { label: "Needs Review", tone: "warning" },
    reviewStatus: { label: "Pending Review", tone: "warning" },
    readinessStatus: { label: "Blocked", tone: "danger" },
  },
  {
    employeeId: "AU-EMP-2026-0087",
    employee: "Inactive Employee",
    issue: "Unmatched Employee ID",
    attendanceStatus: { label: "Not Ready", tone: "danger" },
    reviewStatus: { label: "Needs Review", tone: "warning" },
    readinessStatus: { label: "Blocked", tone: "danger" },
  },
  {
    employeeId: "AU-EMP-2026-0271",
    employee: "Example Employee",
    issue: "Source Conflict",
    attendanceStatus: { label: "Needs Review", tone: "warning" },
    reviewStatus: { label: "Pending Correction", tone: "warning" },
    readinessStatus: { label: "Blocked", tone: "danger" },
  },
];

export const failedPayrollTransfers: readonly FailedPayrollTransfer[] = [
  {
    batchId: "PAY-2026-09-B",
    timestamp: "Sep 23, 2026 · 10:40 AM",
    recordCount: 16,
    failureType: "Connection Timeout",
    status: { label: "Retry Available", tone: "danger" },
  },
  {
    batchId: "PAY-2026-09-X",
    timestamp: "Sep 22, 2026 · 04:18 PM",
    recordCount: 12,
    failureType: "Payload Validation Failed",
    status: { label: "Retry Available", tone: "danger" },
  },
];

export const synchronizationHistory: readonly PayrollHistoryEvent[] = [
  {
    timestamp: "Sep 23, 2026 · 10:42 AM",
    batchId: "PAY-2026-09-A",
    payrollPeriod: "Sep 1–15",
    recordCount: 232,
    operation: "Transfer",
    status: { label: "Successful", tone: "success" },
    details: "Acknowledgement received",
  },
  {
    timestamp: "Sep 23, 2026 · 10:40 AM",
    batchId: "PAY-2026-09-B",
    payrollPeriod: "Sep 1–15",
    recordCount: 16,
    operation: "Transfer",
    status: { label: "Failed", tone: "danger" },
    details: "Connection timeout",
  },
  {
    timestamp: "Sep 23, 2026 · 10:35 AM",
    batchId: "PAY-2026-09-C",
    payrollPeriod: "Sep 1–15",
    recordCount: 8,
    operation: "Payload validation",
    status: { label: "Pending", tone: "warning" },
    details: "Awaiting transfer queue",
  },
];
