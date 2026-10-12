import type { PayrollBatchPeriod, PayrollBatchStatus } from "@/types/payroll-batches";
import type {
  PayrollAcknowledgementStatus,
  PayrollTransferStatus,
} from "@/types/payroll-handoff";
import type { PayrollResultStatus } from "@/types/payroll-results";

export const payrollHistoryLifecycleStatuses = [
  "Preparing",
  "Ready",
  "Awaiting Acknowledgement",
  "Awaiting Payroll Result",
  "Processing",
  "Completed",
  "Completed with Issues",
  "Handoff Failed",
  "Rejected",
  "Failed",
] as const;

export type PayrollHistoryLifecycleStatus = (typeof payrollHistoryLifecycleStatuses)[number];

export type PayrollHistoryActor = {
  uid: string;
  username: string;
  displayName: string;
  role: string;
};

export type PayrollHistoryTimelineEvent = {
  id: string;
  label: string;
  occurredAt: string;
};

export type PayrollHistoryHandoff = {
  transferId: string | null;
  status: PayrollTransferStatus | null;
  acknowledgementStatus: PayrollAcknowledgementStatus | null;
  externalReference: string | null;
  provider: string | null;
  submittedAt: string | null;
  acknowledgedAt: string | null;
  failedAt: string | null;
  failureCode: string | null;
  failureSummary: string | null;
};

export type PayrollHistoryResult = {
  resultId: string | null;
  status: PayrollResultStatus | null;
  externalReference: string | null;
  employeeCount: number;
  processedCount: number;
  pendingCount: number;
  rejectedCount: number;
  failedCount: number;
  payslipAvailableCount: number;
  receivedAt: string | null;
  processedAt: string | null;
  completedAt: string | null;
};

export type PayrollHistoryRecord = {
  batchId: string;
  period: PayrollBatchPeriod;
  employeeCount: number;
  createdBy: PayrollHistoryActor;
  createdAt: string;
  batchStatus: PayrollBatchStatus;
  handoff: PayrollHistoryHandoff;
  result: PayrollHistoryResult;
  lifecycleStatus: PayrollHistoryLifecycleStatus;
  completedAt: string | null;
  issueSummary: string | null;
  timeline: PayrollHistoryTimelineEvent[];
  issues: string[];
  batch: {
    includedRecordCount: number;
    blockedRecordCount: number;
    departmentCount: number;
    readyAt: string | null;
    submittedAt: string | null;
    updatedAt: string;
    notes: string | null;
  };
};

export type PayrollHistoryDetail = PayrollHistoryRecord;

export type PayrollHistoryQuery = {
  search: string;
  periodStart: string | null;
  batchStatus: PayrollBatchStatus | null;
  transferStatus: PayrollTransferStatus | null;
  acknowledgementStatus: PayrollAcknowledgementStatus | null;
  resultStatus: PayrollResultStatus | null;
  fromDate: string | null;
  toDate: string | null;
  page: number;
  pageSize: number;
};

export type PayrollHistorySummary = {
  totalBatches: number;
  completed: number;
  completedWithIssues: number;
  failedOrRejected: number;
  latestCompletedPeriod: string | null;
};

export type PayrollHistoryData = {
  period: PayrollBatchPeriod;
  records: PayrollHistoryRecord[];
  summary: PayrollHistorySummary;
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  periodOptions: PayrollBatchPeriod[];
  batchStatusOptions: PayrollBatchStatus[];
  transferStatusOptions: PayrollTransferStatus[];
  resultStatusOptions: PayrollResultStatus[];
  providerNote: string;
};
