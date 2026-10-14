import type { PayrollBatchPeriod } from "@/types/payroll-batches";
import {
  payrollExternalResultStatuses,
} from "@/types/payroll-handoff";
import type {
  PayrollExternalPayslipStatus,
  PayrollExternalProcessingStatus,
  PayrollExternalResultStatus,
} from "@/types/payroll-handoff";

export const payrollResultStatuses = payrollExternalResultStatuses;

export type PayrollResultStatus = PayrollExternalResultStatus;
export type PayrollResultProcessingStatus = PayrollExternalProcessingStatus;
export type PayrollResultPayslipStatus = PayrollExternalPayslipStatus;

export type PayrollResultActor = {
  uid: string;
  username: string;
  displayName: string;
  role: string;
};

export type PayrollResultItem = {
  id: string;
  resultId: string;
  batchId: string;
  transferId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  period: PayrollBatchPeriod;
  externalEmployeeReference: string;
  externalPayrollReference: string | null;
  processingStatus: PayrollResultProcessingStatus;
  payslipStatus: PayrollResultPayslipStatus;
  payslipId: string | null;
  releasedAt: string | null;
  processedAt: string | null;
  issueCode: string | null;
  issueSummary: string | null;
};

export type PayrollResultRecord = {
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
  createdAt: string;
  updatedAt: string;
};

export type PayrollResultBatchSummary = {
  id: string;
  period: PayrollBatchPeriod;
  employees: number;
  returnedAt: string | null;
  resultStatus: PayrollResultStatus;
  payslipsAvailable: number;
  resultId: string;
  transferId: string;
};

export type PayrollResultNotice = {
  id: string;
  tone: "success" | "warning" | "danger" | "info";
  title: string;
  description: string;
  date: string;
  time: string;
};

export type PayrollResultsSummary = {
  processedEmployees: number;
  payslipsAvailable: number;
  pendingResults: number;
  failedOrRejected: number;
  completedBatches: number;
};

export type PayrollResultsQuery = {
  search: string;
  periodStart: string | null;
  status: PayrollResultProcessingStatus | null;
  department: string | null;
  page: number;
  pageSize: number;
};

export type PayrollResultsData = {
  period: PayrollBatchPeriod;
  currentResult: PayrollResultRecord | null;
  records: PayrollResultItem[];
  batchResults: PayrollResultBatchSummary[];
  notices: PayrollResultNotice[];
  summary: PayrollResultsSummary;
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  periodOptions: PayrollBatchPeriod[];
  departmentOptions: string[];
  providerNote: string;
};

export type PayrollResultIngestionInput = {
  handoff: {
    resultId: string;
    batchId: string;
    transferId: string;
    period: PayrollBatchPeriod;
    provider: string;
    externalReference: string;
  };
  result: {
    batchId: string;
    transferId: string;
    externalResultReference: string;
    status: PayrollExternalResultStatus;
    items: Array<{
      employeeId: string;
      externalEmployeeReference: string;
      externalPayrollReference: string | null;
      processingStatus: PayrollExternalProcessingStatus;
      payslipStatus: PayrollExternalPayslipStatus;
      payslipId: string | null;
      issueCode: string | null;
      issueSummary: string | null;
    }>;
  };
};
