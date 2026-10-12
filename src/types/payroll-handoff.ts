import type { PayrollBatchItemSnapshot, PayrollBatchPeriod } from "@/types/payroll-batches";

export const payrollTransferStatuses = [
  "preparing",
  "submitting",
  "submitted",
  "failed",
] as const;

export type PayrollTransferStatus = (typeof payrollTransferStatuses)[number];

export const payrollAcknowledgementStatuses = [
  "pending",
  "accepted",
  "rejected",
  "not_received",
] as const;

export type PayrollAcknowledgementStatus = (typeof payrollAcknowledgementStatuses)[number];

export type PayrollHandoffActor = {
  uid: string;
  username: string;
  displayName: string;
  role: string;
};

export type PayrollHandoffTimelineEvent = {
  id: string;
  label: string;
  occurredAt: string;
};

export type PayrollHandoffBatchSummary = {
  employeeCount: number;
  includedRecordCount: number;
  blockedRecordCount: number;
  departmentCount: number;
  batchStatus: string;
};

export type PayrollHandoffRecord = {
  transferId: string;
  batchId: string;
  period: PayrollBatchPeriod;
  submittedBy: PayrollHandoffActor;
  submittedAt: string;
  readyAt: string;
  acknowledgedAt: string | null;
  failedAt: string | null;
  transferStatus: PayrollTransferStatus;
  acknowledgementStatus: PayrollAcknowledgementStatus;
  externalReference: string | null;
  provider: string;
  failureCode: string | null;
  failureSummary: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  batchSummary: PayrollHandoffBatchSummary;
  timeline: PayrollHandoffTimelineEvent[];
};

export type PayrollHandoffReadyBatch = {
  id: string;
  period: PayrollBatchPeriod;
  employees: number;
  includedRecords: number;
  departments: number;
  createdBy: string;
  createdAt: string;
  blockedRecords: number;
};

export type PayrollHandoffSummary = {
  readyForHandoff: number;
  inProgress: number;
  acknowledged: number;
  failed: number;
  awaitingAcknowledgement: number;
};

export type PayrollHandoffQuery = {
  search: string;
  periodStart: string | null;
  transferStatus: PayrollTransferStatus | null;
  fromDate: string | null;
  toDate: string | null;
  page: number;
  pageSize: number;
};

export type PayrollHandoffData = {
  period: PayrollBatchPeriod;
  readyBatches: PayrollHandoffReadyBatch[];
  history: PayrollHandoffRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  periodOptions: PayrollBatchPeriod[];
  summary: PayrollHandoffSummary;
  providerNote: string;
};

export type PayrollHandoffSubmissionPayload = {
  batchId: string;
  transferId: string;
  period: PayrollBatchPeriod;
  records: PayrollBatchItemSnapshot[];
};

export type PayrollExternalProcessingStatus = "processed" | "pending" | "rejected" | "failed";

export type PayrollExternalPayslipStatus = "available" | "not_yet_available" | "unavailable";

export type PayrollExternalResultStatus =
  | "processing"
  | "completed"
  | "completed_with_issues"
  | "partially_completed"
  | "rejected"
  | "failed";

export type PayrollExternalResultItem = {
  employeeId: string;
  externalEmployeeReference: string;
  externalPayrollReference: string | null;
  processingStatus: PayrollExternalProcessingStatus;
  payslipStatus: PayrollExternalPayslipStatus;
  payslipId: string | null;
  issueCode: string | null;
  issueSummary: string | null;
};

export type PayrollExternalResult = {
  batchId: string;
  transferId: string;
  externalResultReference: string;
  status: PayrollExternalResultStatus;
  items: PayrollExternalResultItem[];
};

export type PayrollIntegrationResponse = {
  accepted: boolean;
  acknowledgementStatus: "accepted" | "rejected" | "pending";
  externalReference: string | null;
  provider: string;
  failureCode?: string;
  failureSummary?: string;
  result?: PayrollExternalResult;
};
