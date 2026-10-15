import type { PayrollBatchPeriod } from "@/types/payroll-batches";
import type { PayrollResultStatus } from "@/types/payroll-results";
import {
  accountingAcknowledgementStatuses,
  accountingApprovedPayrollTransferStatuses,
} from "@/types/accounting-transfers";
import type {
  AccountingAcknowledgementStatus,
  AccountingApprovedPayrollTransferStatus,
} from "@/types/accounting-transfers";

export {
  accountingAcknowledgementStatuses,
  accountingApprovedPayrollTransferStatuses,
};
export type {
  AccountingAcknowledgementStatus,
  AccountingApprovedPayrollTransferStatus,
};
export const accountingReadinessStatuses = ["ready", "blocked"] as const;

export type AccountingReadinessStatus =
  (typeof accountingReadinessStatuses)[number];

export type AccountingApprovedPayrollItem = {
  payrollResultId: string;
  period: PayrollBatchPeriod;
  references: {
    batchId: string;
    payrollTransferId: string;
    externalPayrollReference: string | null;
  };
  employeeCount: number;
  processedCount: number;
  pendingCount: number;
  rejectedCount: number;
  failedCount: number;
  payslipAvailableCount: number;
  payrollResultStatus: PayrollResultStatus;
  provider: string;
  returnedAmount: {
    amount: number | null;
    currency: string | null;
  };
  accountingReadiness: {
    status: AccountingReadinessStatus;
    reasons: string[];
  };
  accountingTransfer: {
    status: AccountingApprovedPayrollTransferStatus;
    transferId: string | null;
    acknowledgementStatus: AccountingAcknowledgementStatus | null;
    externalReference: string | null;
    failureSummary: string | null;
    submittedAt: string | null;
    updatedAt: string | null;
  };
  receivedAt: string;
  completedAt: string | null;
  updatedAt: string;
};

export type AccountingApprovedPayrollSummary = {
  approvedPayroll: number;
  readyForTransfer: number;
  transferred: number;
  blocked: number;
};

export type AccountingApprovedPayrollQuery = {
  search: string;
  periodStart: string | null;
  resultStatus: PayrollResultStatus | null;
  readinessStatus: AccountingReadinessStatus | null;
  transferStatus: AccountingApprovedPayrollTransferStatus | null;
  page: number;
  pageSize: number;
};

export type AccountingApprovedPayrollData = {
  records: AccountingApprovedPayrollItem[];
  summary: AccountingApprovedPayrollSummary;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  periodOptions: PayrollBatchPeriod[];
  resultStatusOptions: PayrollResultStatus[];
  readinessStatusOptions: AccountingReadinessStatus[];
  transferStatusOptions: AccountingApprovedPayrollTransferStatus[];
  providerNote: string;
};
