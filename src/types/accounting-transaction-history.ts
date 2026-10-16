import type {
  AccountingAcknowledgementStatus,
  AccountingTransferActor,
  AccountingTransferStatus,
  AccountingTransferTimelineEvent,
} from "@/types/accounting-transfers";
import type { PayrollBatchPeriod } from "@/types/payroll-batches";
import type { PayrollResultStatus } from "@/types/payroll-results";

export const accountingHistoryLifecycleStatuses = [
  "Prepared",
  "Submitted",
  "Awaiting Acknowledgement",
  "Not Received",
  "Completed",
  "Failed",
  "Rejected",
] as const;

export type AccountingHistoryLifecycleStatus =
  (typeof accountingHistoryLifecycleStatuses)[number];

export type AccountingTransactionHistoryItem = {
  transferId: string;
  payrollResultId: string;
  payrollBatchId: string;
  payrollHandoffId: string;
  payrollPeriod: PayrollBatchPeriod;
  payrollReference: string | null;
  payrollResultStatus: PayrollResultStatus | null;
  accountingReference: string | null;
  submittedBy: AccountingTransferActor;
  submittedAt: string;
  preparedAt: string | null;
  preparedBy: AccountingTransferActor | null;
  transferStatus: AccountingTransferStatus;
  acknowledgementStatus: AccountingAcknowledgementStatus;
  lifecycleStatus: AccountingHistoryLifecycleStatus;
  completedAt: string | null;
  employeeCount: number;
  provider: string;
  attemptCount: number;
  issueSummary: string | null;
  hasIssue: boolean;
};

export type AccountingTransactionHistoryDetail = AccountingTransactionHistoryItem & {
  createdAt: string;
  acknowledgedAt: string | null;
  failedAt: string | null;
  updatedAt: string;
  failureCode: string | null;
  timeline: AccountingTransferTimelineEvent[];
  payrollResult: {
    resultId: string;
    batchId: string;
    transferId: string;
    period: PayrollBatchPeriod;
    externalPayrollReference: string;
    status: PayrollResultStatus;
    provider: string;
    employeeCount: number;
    processedCount: number;
    pendingCount: number;
    rejectedCount: number;
    failedCount: number;
    payslipAvailableCount: number;
    receivedAt: string;
    processedAt: string | null;
    completedAt: string | null;
  } | null;
};

export type AccountingTransactionHistoryQuery = {
  search: string;
  periodStart: string | null;
  transferStatus: AccountingTransferStatus | null;
  acknowledgementStatus: AccountingAcknowledgementStatus | null;
  page: number;
  pageSize: number;
};

export type AccountingTransactionHistorySummary = {
  totalTransfers: number;
  successfulTransfers: number;
  awaitingAcknowledgement: number;
  failedOrRejected: number;
  latestCompletedPeriod: string | null;
};

export type AccountingTransactionHistoryData = {
  records: AccountingTransactionHistoryItem[];
  summary: AccountingTransactionHistorySummary;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  periodOptions: PayrollBatchPeriod[];
  transferStatusOptions: AccountingTransferStatus[];
  acknowledgementStatusOptions: AccountingAcknowledgementStatus[];
  providerNote: string;
};
