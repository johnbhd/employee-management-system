import type { PayrollBatchPeriod } from "@/types/payroll-batches";
import type {
  AccountingReadinessStatus,
} from "@/types/accounting-approved-payroll";
import type { PayrollResultStatus } from "@/types/payroll-results";
import type { IconName, StatusTone } from "@/types/ui";

export const accountingDashboardStatusValues = [
  "Blocked",
  "Ready for Transfer",
  "Prepared",
  "Transfer In Progress",
  "Awaiting Acknowledgement",
  "Transferred",
  "Integration Issue",
] as const;

export type AccountingDashboardAccountingStatus =
  (typeof accountingDashboardStatusValues)[number];

export type AccountingDashboardSummary = {
  approvedPayroll: number;
  readyForTransfer: number;
  successfullyTransferred: number;
  integrationIssues: number;
};

export type AccountingDashboardPayroll = {
  payrollResultId: string;
  payrollPeriod: PayrollBatchPeriod;
  payrollReference: string;
  employeeCount: number;
  returnedAmount: {
    amount: number | null;
    currency: string | null;
  };
  payrollStatus: PayrollResultStatus;
  readinessStatus: AccountingReadinessStatus;
  accountingStatus: AccountingDashboardAccountingStatus;
  transferId: string | null;
  transferReference: string | null;
  submittedAt: string | null;
  lastUpdatedAt: string;
  detail: string;
};

export type AccountingIntegrationFlowState =
  | "complete"
  | "current"
  | "pending"
  | "failed";

export type AccountingIntegrationFlowStep = {
  key: "payroll-result" | "accounting-ready" | "submitted" | "acknowledged";
  label: string;
  detail: string;
  state: AccountingIntegrationFlowState;
  occurredAt: string | null;
};

export type AccountingDashboardActivity = {
  id: string;
  type: "submitted" | "acknowledged" | "failed" | "rejected" | "pending";
  title: string;
  description: string;
  occurredAt: string;
  transferId: string;
  payrollResultId: string;
  tone: StatusTone;
  icon: Extract<IconName, "check" | "clock" | "warning" | "info">;
};

export type AccountingDashboardAlert = {
  id: string;
  severity: "info" | "warning" | "error";
  message: string;
  href: string;
};

export type AccountingDashboardHealthItem = {
  name: string;
  detail: string;
  status: string;
  tone: StatusTone;
  lastEventAt: string | null;
};

export type AccountingDashboardData = {
  summary: AccountingDashboardSummary;
  latestApprovedPayroll: AccountingDashboardPayroll | null;
  recentPayrolls: AccountingDashboardPayroll[];
  integrationFlow: AccountingIntegrationFlowStep[];
  recentActivity: AccountingDashboardActivity[];
  alerts: AccountingDashboardAlert[];
  health: AccountingDashboardHealthItem[];
  providerNote: string;
};
