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

export type PayrollBatchAttendanceSnapshot = {
  attendanceRecordId: string;
  attendanceDate: string;
  effectiveTimeIn: string | null;
  effectiveTimeOut: string | null;
  attendanceStatus: string;
  timeInSource: string | null;
  timeOutSource: string | null;
  technicalState: string | null;
  businessStatus: string | null;
};

export type PayrollBatchVerificationSnapshot = {
  attendanceRecordId: string;
  verifiedAt: string | null;
  verifiedBy: unknown;
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
  attendanceSnapshot: PayrollBatchAttendanceSnapshot[] | null;
  scheduleSnapshot: Record<string, unknown> | null;
  verificationSnapshot: PayrollBatchVerificationSnapshot[] | null;
  snapshotCreatedAt: string;
};

export type PayrollBatchRecord = {
  id: string;
  period: PayrollBatchPeriod;
  status: PayrollBatchStatus;
  createdBy: PayrollBatchActor;
  createdAt: string;
  updatedAt: string;
  frozenBy: PayrollBatchActor | null;
  frozenAt: string | null;
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

export type PayrollBatchReadinessReason = {
  code: "EMPTY_BATCH" | "BATCH_NOT_DRAFT";
  owner: "PAYROLL" | "SYSTEM";
  label: string;
};

export type PayrollBatchItemReadiness = {
  itemId: string;
  employeePeriodId: string;
  employeeName: string;
  employeeId: string;
  ready: boolean;
  sourceAttendanceIds: string[];
  reasons: Array<{
    code: string;
    owner: "HR" | "PAYROLL" | "SYSTEM";
    label: string;
  }>;
};

export type PayrollBatchReadiness = {
  batchId: string;
  status: PayrollBatchStatus;
  ready: boolean;
  totalItems: number;
  eligibleItems: number;
  blockedItems: number;
  reasons: PayrollBatchReadinessReason[];
  items: PayrollBatchItemReadiness[];
};
