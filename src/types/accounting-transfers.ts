import type { PayrollBatchPeriod } from "@/types/payroll-batches";
import type { AccountingApprovedPayrollItem } from "@/types/accounting-approved-payroll";
import type { PayrollResultStatus } from "@/types/payroll-results";

export const accountingTransferStatuses = [
  "preparing",
  "prepared",
  "submitting",
  "submitted",
  "failed",
] as const;

export type AccountingTransferStatus = (typeof accountingTransferStatuses)[number];

export const accountingApprovedPayrollTransferStatuses = [
  "not_transferred",
  ...accountingTransferStatuses,
] as const;

export type AccountingApprovedPayrollTransferStatus =
  (typeof accountingApprovedPayrollTransferStatuses)[number];

export const accountingAcknowledgementStatuses = [
  "pending",
  "accepted",
  "rejected",
  "not_received",
] as const;

export type AccountingAcknowledgementStatus =
  (typeof accountingAcknowledgementStatuses)[number];

export type AccountingTransferActor = {
  uid: string;
  username: string;
  displayName: string;
  role: string;
};

export type AccountingTransferTimelineEvent = {
  id: string;
  label: string;
  occurredAt: string;
};

export type AccountingTransferSnapshotItem = {
  employeeId: string;
  employeeName: string;
  department: string;
  externalEmployeeReference: string;
  externalPayrollReference: string | null;
  processingStatus: string;
  payslipStatus: string;
  issueCode: string | null;
  issueSummary: string | null;
};

export type AccountingTransferSnapshot = {
  source: {
    mode: "external-payroll" | "simulated-payroll";
    provider: string;
  };
  payroll: {
    payrollResultId: string;
    payrollBatchId: string;
    payrollHandoffId: string;
    externalPayrollReference: string;
    periodStart: string;
    periodEnd: string;
    resultStatus: PayrollResultStatus;
    receivedAt: string;
    processedAt: string | null;
    completedAt: string | null;
  };
  summary: {
    employeeCount: number;
    processedCount: number;
    pendingCount: number;
    rejectedCount: number;
    failedCount: number;
    payslipAvailableCount: number;
  };
  items: AccountingTransferSnapshotItem[];
};

export type AccountingTransferRecord = {
  transferId: string;
  payrollResultId: string;
  payrollBatchId: string;
  payrollHandoffId: string;
  period: PayrollBatchPeriod;
  externalPayrollReference: string;
  employeeCount: number;
  payrollResultStatus: PayrollResultStatus;
  submittedBy: AccountingTransferActor;
  submittedAt: string;
  preparedBy: AccountingTransferActor | null;
  preparedAt: string | null;
  snapshot: AccountingTransferSnapshot | null;
  sourceMode: string | null;
  acknowledgedAt: string | null;
  failedAt: string | null;
  transferStatus: AccountingTransferStatus;
  acknowledgementStatus: AccountingAcknowledgementStatus;
  externalAccountingReference: string | null;
  provider: string;
  failureCode: string | null;
  failureSummary: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  timeline: AccountingTransferTimelineEvent[];
};

export type AccountingConnectionStatus = {
  system: string;
  status: string;
  tone: "success" | "warning" | "danger" | "info" | "muted";
  lastSync: string;
  details: string;
};

export type AccountingTransferView = {
  transferId: string;
  payrollResultId: string;
  transactionReference: string;
  payrollReference: string;
  period: string;
  date: string;
  time: string;
  records: string;
  amount: string;
  result: string;
  resultTone: "success" | "warning" | "danger" | "info" | "muted";
  status: string;
  tone: "success" | "warning" | "danger" | "info" | "muted";
  acknowledgement: string;
  error: string | null;
};

export type AccountingIntegrationSummary = {
  readyForTransfer: number;
  preparedTransfers: number;
  inProgress: number;
  successfulTransfers: number;
  awaitingAcknowledgement: number;
  failedTransfers: number;
};

export type AccountingIntegrationStatusQuery = {
  search: string;
  transferStatus: AccountingTransferStatus | null;
  page: number;
  pageSize: number;
};

export type AccountingIntegrationStatusData = {
  readyRecords: AccountingApprovedPayrollItem[];
  transfers: AccountingTransferRecord[];
  attention: AccountingTransferView[];
  history: AccountingTransferView[];
  connectionStatuses: AccountingConnectionStatus[];
  summary: AccountingIntegrationSummary;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  transferStatusOptions: AccountingTransferStatus[];
  providerNote: string;
};
