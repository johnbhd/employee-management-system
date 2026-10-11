import type { IconName, StatusTone } from "@/types/ui";

export type PayrollDashboardPeriod = {
  start: string;
  end: string;
  label: string;
};

export type PayrollDashboardMetrics = {
  verifiedAttendance: number;
  readyForHandoff: number;
  blocked: number;
  transferred: number;
  transferIssues: number;
};

export type PayrollReadinessRecord = {
  employeeName: string;
  employeeId: string;
  department: string;
  payrollPeriod: string;
  attendanceStatus: string;
  attendanceTone: StatusTone;
  verification: string;
  verificationTone: StatusTone;
  payrollReadiness: string;
  payrollReadinessTone: StatusTone;
  batchStatus: string;
  batchTone: StatusTone;
};

export type PayrollBatch = {
  id: string;
  payrollPeriod: string;
  employees: string;
  createdBy: string;
  transferStatus: string;
  transferTone: StatusTone;
};

export type PayrollAlert = {
  id: string;
  message: string;
  status: string;
  tone: StatusTone;
  icon: Extract<IconName, "warning" | "check" | "clock">;
};

export type PayrollDashboardData = {
  period: PayrollDashboardPeriod;
  metrics: PayrollDashboardMetrics;
  readiness: PayrollReadinessRecord[];
  recentBatches: PayrollBatch[];
  alerts: PayrollAlert[];
};
