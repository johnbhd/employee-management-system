import type { IconName, StatusTone } from "@/types/ui";

export type PayslipStatus = "released" | "in-progress";

export type EmployeePayslipDeduction = {
  label: string;
  amount: number;
};

export type EmployeePayslip = {
  id: string;
  payrollPeriod: string;
  payrollMonth: string;
  payrollMonthKey: string;
  dateReleased: string | null;
  payFrequency: string;
  monthlyBasicSalary: number | null;
  cutoffBasicPay: number | null;
  referenceDailyRate: number | null;
  earnings: {
    basicPay: number | null;
    totalEarnings: number | null;
  };
  deductions: readonly EmployeePayslipDeduction[];
  totalDeductions: number | null;
  netPay: number | null;
  status: PayslipStatus;
  statusLabel: string;
  statusTone: StatusTone;
};

export type EmployeeMonthlyPayslipStatus = "complete" | "in-progress";

export type EmployeeMonthlyPayslip = {
  id: string;
  monthKey: string;
  monthLabel: string;
  releasedCutoffCount: number;
  totalCutoffCount: number;
  monthlyBasicSalary: number | null;
  referenceDailyRate: number | null;
  totalEarnings: number | null;
  totalDeductions: number | null;
  netPay: number | null;
  status: EmployeeMonthlyPayslipStatus;
  statusLabel: string;
  statusTone: StatusTone;
  includedPayslipIds: readonly string[];
};

export type EmployeePayslipStat = {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: "blue" | "red" | "green" | "purple";
};

export type EmployeePayslipHistoryData = {
  payslips: readonly EmployeePayslip[];
  monthlyPayslips: readonly EmployeeMonthlyPayslip[];
  years: readonly string[];
  cutoffStats: readonly EmployeePayslipStat[];
  monthlyStats: readonly EmployeePayslipStat[];
};
