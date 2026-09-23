import type { StatusTone } from "@/types/ui";

export type AccountingStatus = {
  label: string;
  tone: StatusTone;
};

export type AccountingTransferCandidate = {
  payrollBatchId: string;
  payrollPeriod: string;
  employeeCount: number;
  sourceStatus: AccountingStatus;
  readinessStatus: AccountingStatus;
  transferStatus: AccountingStatus;
  acknowledgementStatus: AccountingStatus;
};

export type AccountingFieldMapping = {
  sourceField: string;
  targetField: string;
  status: string;
  tone: StatusTone;
};

export type AccountingTransferBatch = {
  transferId: string;
  payrollBatchId: string;
  payrollPeriod: string;
  recordCount: number;
  preparedAt: string;
  transferStatus: AccountingStatus;
  acknowledgementStatus: AccountingStatus;
};

export type BlockedAccountingTransfer = {
  payrollBatchId: string;
  payrollPeriod: string;
  issue: string;
  upstreamStatus: AccountingStatus;
  readinessStatus: AccountingStatus;
};

export type FailedAccountingTransfer = {
  transferId: string;
  timestamp: string;
  payrollBatchId: string;
  failureType: string;
  status: AccountingStatus;
};

export type AccountingHistoryEvent = {
  timestamp: string;
  transferId: string;
  payrollBatchId: string;
  operation: string;
  status: AccountingStatus;
  acknowledgement: AccountingStatus;
  detail: string;
};

export const accountingTransferCandidates: readonly AccountingTransferCandidate[] = [
  {
    payrollBatchId: "PAY-2026-09-A",
    payrollPeriod: "Sep 1–15, 2026",
    employeeCount: 116,
    sourceStatus: { label: "Approved", tone: "success" },
    readinessStatus: { label: "Ready", tone: "success" },
    transferStatus: { label: "Pending Transfer", tone: "warning" },
    acknowledgementStatus: { label: "Pending", tone: "warning" },
  },
  {
    payrollBatchId: "PAY-2026-08-B",
    payrollPeriod: "Aug 16–31, 2026",
    employeeCount: 121,
    sourceStatus: { label: "Approved", tone: "success" },
    readinessStatus: { label: "Transferred", tone: "info" },
    transferStatus: { label: "Successful", tone: "success" },
    acknowledgementStatus: { label: "Acknowledged", tone: "success" },
  },
  {
    payrollBatchId: "PAY-2026-09-B",
    payrollPeriod: "Sep 1–15, 2026",
    employeeCount: 8,
    sourceStatus: { label: "Pending Review", tone: "warning" },
    readinessStatus: { label: "Blocked", tone: "danger" },
    transferStatus: { label: "Not Sent", tone: "muted" },
    acknowledgementStatus: { label: "Not Applicable", tone: "muted" },
  },
  {
    payrollBatchId: "PAY-2026-08-A",
    payrollPeriod: "Aug 1–15, 2026",
    employeeCount: 118,
    sourceStatus: { label: "Approved", tone: "success" },
    readinessStatus: { label: "Transferred", tone: "info" },
    transferStatus: { label: "Successful", tone: "success" },
    acknowledgementStatus: { label: "Acknowledged", tone: "success" },
  },
];

export const accountingReadinessItems = [
  { label: "Ready for Accounting", value: "4", percent: 80, tone: "success" as const },
  { label: "Pending Payroll Completion", value: "1", percent: 20, tone: "warning" as const },
  { label: "Pending Approval", value: "1", percent: 20, tone: "warning" as const },
  { label: "Blocked by Validation", value: "1", percent: 20, tone: "warning" as const },
  { label: "Transferred", value: "3", percent: 60, tone: "success" as const },
];

export const accountingFieldMappings: readonly AccountingFieldMapping[] = [
  {
    sourceField: "Payroll Batch ID",
    targetField: "payroll_batch_id",
    status: "Mapped",
    tone: "success",
  },
  {
    sourceField: "Payroll Period",
    targetField: "payroll_period",
    status: "Mapped",
    tone: "success",
  },
  {
    sourceField: "Payroll Status",
    targetField: "payroll_status",
    status: "Mapped",
    tone: "success",
  },
  {
    sourceField: "Employee Count",
    targetField: "employee_count",
    status: "Mapped",
    tone: "success",
  },
  {
    sourceField: "Transfer Reference",
    targetField: "external_reference",
    status: "Prototype",
    tone: "info",
  },
  {
    sourceField: "Processing Date",
    targetField: "processing_date",
    status: "To Be Confirmed",
    tone: "warning",
  },
];

export const accountingValidationChecks = [
  {
    label: "Payroll Batch ID present",
    detail: "Approved Payroll reference is included in the prototype payload.",
    status: "Passed",
    tone: "success" as const,
  },
  {
    label: "Payroll status eligible",
    detail: "Only approved Payroll information may continue downstream.",
    status: "Passed",
    tone: "success" as const,
  },
  {
    label: "Required integration fields complete",
    detail: "Production Accounting fields remain To Be Confirmed.",
    status: "Warning",
    tone: "warning" as const,
  },
  {
    label: "Duplicate transfer check",
    detail: "Previously acknowledged batches are checked before preparation.",
    status: "Passed",
    tone: "success" as const,
  },
  {
    label: "External reference prepared",
    detail: "Reference format is illustrative and not an official Accounting ID.",
    status: "Warning",
    tone: "warning" as const,
  },
];

export const accountingTransferBatches: readonly AccountingTransferBatch[] = [
  {
    transferId: "ACC-2026-09-001",
    payrollBatchId: "PAY-2026-09-A",
    payrollPeriod: "Sep 1–15, 2026",
    recordCount: 116,
    preparedAt: "Sep 18, 2026 · 09:15 AM",
    transferStatus: { label: "Successful", tone: "success" },
    acknowledgementStatus: { label: "Acknowledged", tone: "success" },
  },
  {
    transferId: "ACC-2026-09-002",
    payrollBatchId: "PAY-2026-09-B",
    payrollPeriod: "Sep 1–15, 2026",
    recordCount: 8,
    preparedAt: "Sep 18, 2026 · 09:27 AM",
    transferStatus: { label: "Failed", tone: "danger" },
    acknowledgementStatus: { label: "Not Acknowledged", tone: "danger" },
  },
  {
    transferId: "ACC-2026-09-003",
    payrollBatchId: "PAY-2026-08-C",
    payrollPeriod: "Aug 16–31, 2026",
    recordCount: 120,
    preparedAt: "Sep 2, 2026 · 04:42 PM",
    transferStatus: { label: "Queued", tone: "warning" },
    acknowledgementStatus: { label: "Pending", tone: "warning" },
  },
];

export const blockedAccountingTransfers: readonly BlockedAccountingTransfer[] = [
  {
    payrollBatchId: "PAY-2026-09-B",
    payrollPeriod: "Sep 1–15, 2026",
    issue: "Payroll approval pending",
    upstreamStatus: { label: "Pending Review", tone: "warning" },
    readinessStatus: { label: "Blocked", tone: "danger" },
  },
  {
    payrollBatchId: "PAY-2026-08-D",
    payrollPeriod: "Aug 16–31, 2026",
    issue: "External reference missing",
    upstreamStatus: { label: "Approved", tone: "success" },
    readinessStatus: { label: "Validation Failed", tone: "danger" },
  },
];

export const failedAccountingTransfers: readonly FailedAccountingTransfer[] = [
  {
    transferId: "ACC-2026-09-002",
    timestamp: "Sep 18, 2026 · 09:27 AM",
    payrollBatchId: "PAY-2026-09-B",
    failureType: "Acknowledgement timeout",
    status: { label: "Retry Available", tone: "danger" },
  },
];

export const accountingSynchronizationHistory: readonly AccountingHistoryEvent[] = [
  {
    timestamp: "Sep 18, 2026 · 09:15 AM",
    transferId: "ACC-2026-09-001",
    payrollBatchId: "PAY-2026-09-A",
    operation: "Transfer",
    status: { label: "Successful", tone: "success" },
    acknowledgement: { label: "Acknowledged", tone: "success" },
    detail: "Prototype transfer completed.",
  },
  {
    timestamp: "Sep 18, 2026 · 09:27 AM",
    transferId: "ACC-2026-09-002",
    payrollBatchId: "PAY-2026-09-B",
    operation: "Transfer",
    status: { label: "Failed", tone: "danger" },
    acknowledgement: { label: "Not Acknowledged", tone: "danger" },
    detail: "Acknowledgement timeout in prototype mode.",
  },
  {
    timestamp: "Sep 2, 2026 · 04:42 PM",
    transferId: "ACC-2026-09-003",
    payrollBatchId: "PAY-2026-08-C",
    operation: "Queue",
    status: { label: "Queued", tone: "warning" },
    acknowledgement: { label: "Pending", tone: "warning" },
    detail: "Awaiting simulated transfer window.",
  },
  {
    timestamp: "Aug 18, 2026 · 11:06 AM",
    transferId: "ACC-2026-08-004",
    payrollBatchId: "PAY-2026-08-A",
    operation: "Duplicate check",
    status: { label: "Skipped", tone: "muted" },
    acknowledgement: { label: "Acknowledged", tone: "success" },
    detail: "Previously acknowledged batch was not sent again.",
  },
];
