import type { IconName, Metric, StatusTone } from "@/types/ui";

export const payrollAccountingSummaryMetrics = [
  {
    label: "Verified attendance batches",
    value: "4",
    note: "Ready for Payroll review",
    icon: "check",
    tone: "success",
  },
  {
    label: "Pending verification",
    value: "2",
    note: "Held before transfer",
    icon: "clock",
    tone: "warning",
  },
  {
    label: "Acknowledged transfers",
    value: "3",
    note: "Prototype responses",
    icon: "arrow",
    tone: "info",
  },
  {
    label: "Failed transfers",
    value: "1",
    note: "Retry attention needed",
    icon: "warning",
    tone: "danger",
  },
] as const satisfies readonly Metric[];

export const payrollAccountingReadinessItems = [
  { label: "Verified attendance", value: "4 batches", percent: 80, tone: "success" as const },
  { label: "Pending HR verification", value: "2 batches", percent: 40, tone: "warning" as const },
  { label: "Employee IDs matched", value: "5 batches", percent: 100, tone: "success" as const },
  { label: "Blocked by validation", value: "1 batch", percent: 20, tone: "warning" as const },
  { label: "Acknowledged by Payroll", value: "3 batches", percent: 60, tone: "success" as const },
];

export type PayrollAccountingValidationStatus = "Passed" | "Warning" | "Failed";

export type PayrollAccountingValidationCheck = {
  label: string;
  detail: string;
  status: PayrollAccountingValidationStatus;
  tone: StatusTone;
};

export const payrollAccountingValidationChecks: readonly PayrollAccountingValidationCheck[] = [
  {
    label: "Attendance verification state",
    detail: "Only final HR-verified attendance can enter the transfer queue.",
    status: "Passed",
    tone: "success",
  },
  {
    label: "Employee ID matching",
    detail: "Every candidate includes a reference to the HRPS Employee ID.",
    status: "Passed",
    tone: "success",
  },
  {
    label: "Required attendance fields",
    detail: "One candidate is waiting for a missing time-out review.",
    status: "Warning",
    tone: "warning",
  },
  {
    label: "Downstream contract",
    detail: "The Existing Payroll contract is still a prototype boundary.",
    status: "Warning",
    tone: "warning",
  },
];

export type PayrollAccountingFlowNode = {
  label: string;
  detail: string;
  icon: IconName;
  status: string;
  tone: StatusTone;
};

export const payrollAccountingFlow: readonly PayrollAccountingFlowNode[] = [
  {
    label: "Unified Attendance",
    detail: "Verified records",
    icon: "unified",
    status: "Eligible",
    tone: "success",
  },
  {
    label: "Verification gate",
    detail: "Final checks",
    icon: "shield",
    status: "Passed",
    tone: "success",
  },
  {
    label: "Payroll payload",
    detail: "Mapped attendance",
    icon: "file",
    status: "Prepared",
    tone: "info",
  },
  {
    label: "Transfer batch",
    detail: "Prototype handoff",
    icon: "arrow",
    status: "Tracked",
    tone: "warning",
  },
  {
    label: "Existing Payroll",
    detail: "External system",
    icon: "payroll",
    status: "External",
    tone: "muted",
  },
  {
    label: "Acknowledgement",
    detail: "Transfer result",
    icon: "check",
    status: "Recorded",
    tone: "success",
  },
];

export type PayrollAccountingTransferRecord = {
  batchId: string;
  period: string;
  records: string;
  verification: string;
  verificationTone: StatusTone;
  transferStatus: string;
  transferTone: StatusTone;
  acknowledgement: string;
  acknowledgementTone: StatusTone;
};

export const payrollAccountingTransferQueue: readonly PayrollAccountingTransferRecord[] = [
  {
    batchId: "ATT-2026-09-A",
    period: "Sep 1–15, 2026",
    records: "124",
    verification: "Verified",
    verificationTone: "success",
    transferStatus: "Acknowledged",
    transferTone: "success",
    acknowledgement: "Received",
    acknowledgementTone: "success",
  },
  {
    batchId: "ATT-2026-09-B",
    period: "Sep 1–15, 2026",
    records: "118",
    verification: "Pending",
    verificationTone: "warning",
    transferStatus: "Held",
    transferTone: "warning",
    acknowledgement: "Waiting",
    acknowledgementTone: "warning",
  },
  {
    batchId: "ATT-2026-08-C",
    period: "Aug 16–31, 2026",
    records: "121",
    verification: "Verified",
    verificationTone: "success",
    transferStatus: "Acknowledged",
    transferTone: "success",
    acknowledgement: "Received",
    acknowledgementTone: "success",
  },
  {
    batchId: "ATT-2026-08-B",
    period: "Aug 16–31, 2026",
    records: "119",
    verification: "Warning",
    verificationTone: "warning",
    transferStatus: "Failed",
    transferTone: "danger",
    acknowledgement: "Not received",
    acknowledgementTone: "danger",
  },
];

export type PayrollAccountingFieldMapping = {
  source: string;
  target: string;
  status: string;
  tone: StatusTone;
};

export const payrollAccountingFieldMappings: readonly PayrollAccountingFieldMapping[] = [
  { source: "Employee ID", target: "employee_reference", status: "Confirmed", tone: "success" },
  { source: "Attendance date", target: "attendance_date", status: "Confirmed", tone: "success" },
  { source: "Time in / time out", target: "attendance_times", status: "Confirmed", tone: "success" },
  { source: "Verification state", target: "verification_status", status: "Confirmed", tone: "success" },
  { source: "Payroll period", target: "pay_period", status: "To be confirmed", tone: "warning" },
];

export type PayrollAccountingException = {
  type: string;
  batchId: string;
  issue: string;
  status: string;
  tone: StatusTone;
};

export const payrollAccountingExceptions: readonly PayrollAccountingException[] = [
  {
    type: "Blocked",
    batchId: "ATT-2026-09-B",
    issue: "Final HR verification has not been recorded for the batch.",
    status: "Held",
    tone: "warning",
  },
  {
    type: "Failed",
    batchId: "ATT-2026-08-B",
    issue: "Existing Payroll did not acknowledge the attendance transfer.",
    status: "Retry pending",
    tone: "danger",
  },
];

export type PayrollAccountingHistoryEvent = {
  time: string;
  batchId: string;
  operation: string;
  status: string;
  tone: StatusTone;
};

export const payrollAccountingSynchronizationHistory: readonly PayrollAccountingHistoryEvent[] = [
  {
    time: "09:15 AM",
    batchId: "ATT-2026-09-A",
    operation: "Payroll attendance transfer acknowledged",
    status: "Success",
    tone: "success",
  },
  {
    time: "08:42 AM",
    batchId: "ATT-2026-08-C",
    operation: "Attendance payload validation completed",
    status: "Ready",
    tone: "info",
  },
  {
    time: "Yesterday",
    batchId: "ATT-2026-08-B",
    operation: "Payroll acknowledgement timeout recorded",
    status: "Failed",
    tone: "danger",
  },
];

export const payrollAccountingHealth = [
  { label: "Integration mode", value: "Prototype / Simulated", tone: "info" as const },
  { label: "Last successful transfer", value: "ATT-2026-09-A", tone: "success" as const },
  { label: "Last acknowledgement", value: "Received · 09:15 AM", tone: "success" as const },
  { label: "Pending transfers", value: "2 batches", tone: "warning" as const },
  { label: "Failed transfers", value: "1 batch", tone: "danger" as const },
] as const;
