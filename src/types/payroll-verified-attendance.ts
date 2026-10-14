import type { PayrollDashboardPeriod } from "@/types/payroll-dashboard";
import type { PayrollBatchStatus } from "@/types/payroll-batches";
import type { StatusTone } from "@/types/ui";

export type PayrollReadinessStatus = "ready" | "blocked";

export type PayrollVerifiedAttendanceBatchStatus = PayrollBatchStatus | "not-added";

export type PayrollVerifiedAttendanceQuery = {
  search: string;
  department: string | null;
  readiness: PayrollReadinessStatus | null;
  batch: PayrollVerifiedAttendanceBatchStatus | null;
  page: number;
  pageSize: number;
};

export type PayrollVerifiedAttendanceItem = {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  payrollPeriod: PayrollDashboardPeriod;
  attendanceSummary: {
    presentDays: number;
    lateCount: number | null;
    lateMinutes: number | null;
    undertimeMinutes: number | null;
  };
  hrVerification: {
    status: "verified";
    verifiedAt: string | null;
  };
  payrollReadiness: {
    status: PayrollReadinessStatus;
    tone: StatusTone;
    reasons: string[];
  };
  batch: {
    status: PayrollVerifiedAttendanceBatchStatus;
    label: string;
    tone: StatusTone;
    batchId: string | null;
  };
  selectable: boolean;
};

export type PayrollVerifiedAttendanceData = {
  period: PayrollDashboardPeriod;
  summary: {
    verifiedRecords: number;
    ready: number;
    includedInBatch: number;
    blocked: number;
    needsFollowUp: number;
  };
  items: PayrollVerifiedAttendanceItem[];
  departments: string[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};
