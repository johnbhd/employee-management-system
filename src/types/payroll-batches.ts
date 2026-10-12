import type { PayrollDashboardPeriod } from "@/types/payroll-dashboard";
import type { PayrollVerifiedAttendanceItem } from "@/types/payroll-verified-attendance";

export const payrollBatchStatuses = [
  "Draft",
  "Ready",
  "Submitted",
  "Acknowledged",
  "Blocked",
  "Failed",
] as const;

export type PayrollBatchStatus = (typeof payrollBatchStatuses)[number];

export type PayrollBatchPeriod = PayrollDashboardPeriod;

export type PayrollBatchActor = {
  uid: string;
  username: string;
  displayName: string;
  role: string;
};

export type PayrollBatchItemSnapshot = {
  employeePeriodId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  payrollPeriod: PayrollBatchPeriod;
  presentDays: number;
  lateCount: number | null;
  lateMinutes: number | null;
  undertimeMinutes: number | null;
  hrVerificationStatus: "verified";
  payrollReadiness: "ready";
  sourceAttendanceIds: string[];
  snapshotCreatedAt: string;
};

export type PayrollBatchRecord = {
  id: string;
  period: PayrollBatchPeriod;
  status: PayrollBatchStatus;
  createdBy: PayrollBatchActor;
  createdAt: string;
  updatedAt: string;
  submittedBy: PayrollBatchActor | null;
  submittedAt: string | null;
  recordCount: number;
  blockedCount: number;
  departmentNames: string[];
  includedRecords: PayrollBatchItemSnapshot[];
  notes: string | null;
};

export type PayrollBatchCandidate = {
  item: PayrollVerifiedAttendanceItem;
  sourceAttendanceIds: string[];
};

export type PayrollBatchesData = {
  period: PayrollBatchPeriod;
  batches: PayrollBatchRecord[];
  availableRecords: PayrollBatchCandidate[];
  summary: {
    draftBatches: number;
    readyBatches: number;
    submittedBatches: number;
    blockedBatches: number;
    recordsInDrafts: number;
    blockedRecords: number;
  };
};
