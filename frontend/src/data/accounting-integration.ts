import type { Metric, StatusTone } from "@/types/ui";

export const accountingSummaryMetrics = [
  {
    label: "Accounting-ready batches",
    value: "4",
    note: "Approved Payroll information",
    icon: "check",
    tone: "success",
  },
  {
    label: "Pending Payroll approval",
    value: "2",
    note: "Held from downstream transfer",
    icon: "clock",
    tone: "warning",
  },
  {
    label: "Successful transfers",
    value: "3",
    note: "Prototype acknowledgements",
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

export const accountingReadinessItems = [
  { label: "Ready for Accounting", value: "4 batches", percent: 80, tone: "success" as const },
  { label: "Pending Payroll completion", value: "2 batches", percent: 40, tone: "warning" as const },
  { label: "Pending approval", value: "1 batch", percent: 20, tone: "warning" as const },
  { label: "Blocked by validation", value: "1 batch", percent: 20, tone: "warning" as const },
  { label: "Acknowledged", value: "3 batches", percent: 60, tone: "success" as const },
];

export type AccountingValidationStatus = "Passed" | "Warning" | "Failed";

export type AccountingValidationCheck = {
  label: string;
  detail: string;
  status: AccountingValidationStatus;
  tone: StatusTone;
};

export const accountingValidationChecks: readonly AccountingValidationCheck[] = [
  {
    label: "Payroll batch reference",
    detail: "Every candidate includes a source Payroll batch ID.",
    status: "Passed",
    tone: "success",
  },
  {
    label: "Payroll approval state",
    detail: "Only approved Payroll information can enter the transfer queue.",
    status: "Passed",
    tone: "success",
  },
  {
    label: "Required field mapping",
    detail: "One candidate is waiting for a confirmed Accounting field.",
    status: "Warning",
    tone: "warning",
  },
  {
    label: "Downstream reference",
    detail: "The external Accounting contract is still a prototype boundary.",
    status: "Warning",
    tone: "warning",
  },
];

export type AccountingTransferRecord = {
  batchId: string;
  period: string;
  records: string;
  readiness: string;
  readinessTone: StatusTone;
  transferStatus: string;
  transferTone: StatusTone;
  acknowledgement: string;
  acknowledgementTone: StatusTone;
};

export const accountingTransferQueue: readonly AccountingTransferRecord[] = [
  {
    batchId: "PAY-2026-09-A",
    period: "Sep 1–15, 2026",
    records: "124",
    readiness: "Ready",
    readinessTone: "success",
    transferStatus: "Acknowledged",
    transferTone: "success",
    acknowledgement: "Received",
    acknowledgementTone: "success",
  },
  {
    batchId: "PAY-2026-09-B",
    period: "Sep 1–15, 2026",
    records: "118",
    readiness: "Pending approval",
    readinessTone: "warning",
    transferStatus: "Held",
    transferTone: "warning",
    acknowledgement: "Waiting",
    acknowledgementTone: "warning",
  },
  {
    batchId: "PAY-2026-08-C",
    period: "Aug 16–31, 2026",
    records: "121",
    readiness: "Ready",
    readinessTone: "success",
    transferStatus: "Acknowledged",
    transferTone: "success",
    acknowledgement: "Received",
    acknowledgementTone: "success",
  },
  {
    batchId: "PAY-2026-08-B",
    period: "Aug 16–31, 2026",
    records: "119",
    readiness: "Validation warning",
    readinessTone: "warning",
    transferStatus: "Failed",
    transferTone: "danger",
    acknowledgement: "Not received",
    acknowledgementTone: "danger",
  },
];

export type AccountingFieldMapping = {
  source: string;
  target: string;
  status: string;
  tone: StatusTone;
};

export const accountingFieldMappings: readonly AccountingFieldMapping[] = [
  { source: "Payroll batch ID", target: "external_batch_reference", status: "Confirmed", tone: "success" },
  { source: "Employee ID", target: "employee_reference", status: "Confirmed", tone: "success" },
  { source: "Payroll period", target: "pay_period", status: "To be confirmed", tone: "warning" },
  { source: "Approved amount", target: "financial_value", status: "Owned by Payroll", tone: "muted" },
];

export type AccountingException = {
  type: string;
  batchId: string;
  issue: string;
  status: string;
  tone: StatusTone;
};

export const accountingExceptions: readonly AccountingException[] = [
  {
    type: "Blocked",
    batchId: "PAY-2026-09-B",
    issue: "Payroll approval has not been recorded.",
    status: "Held",
    tone: "warning",
  },
  {
    type: "Failed",
    batchId: "PAY-2026-08-B",
    issue: "Existing Accounting did not acknowledge the transfer.",
    status: "Retry pending",
    tone: "danger",
  },
];

export type AccountingHistoryEvent = {
  time: string;
  batchId: string;
  operation: string;
  status: string;
  tone: StatusTone;
};

export const accountingSynchronizationHistory: readonly AccountingHistoryEvent[] = [
  {
    time: "09:15 AM",
    batchId: "PAY-2026-09-A",
    operation: "Accounting transfer acknowledged",
    status: "Success",
    tone: "success",
  },
  {
    time: "08:42 AM",
    batchId: "PAY-2026-08-C",
    operation: "Payload validation completed",
    status: "Ready",
    tone: "info",
  },
  {
    time: "Yesterday",
    batchId: "PAY-2026-08-B",
    operation: "Acknowledgement timeout recorded",
    status: "Failed",
    tone: "danger",
  },
];
