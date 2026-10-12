import type { PayrollBatchPeriod } from "@/types/payroll-batches";
import type { AccountingApprovedPayrollItem } from "@/types/accounting-approved-payroll";

export const accountingTransferStatuses = [
  "preparing",
  "submitting",
  "submitted",
  "failed",
] as const;

export type AccountingTransferStatus = (typeof accountingTransferStatuses)[number];

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

export type AccountingTransferRecord = {
  transferId: string;
  payrollResultId: string;
  payrollBatchId: string;
  payrollHandoffId: string;
  period: PayrollBatchPeriod;
  externalPayrollReference: string;
  employeeCount: number;
  payrollResultStatus: string;
  submittedBy: AccountingTransferActor;
  submittedAt: string;
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
