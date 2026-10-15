import type { IconName, StatusTone } from "@/types/ui";

export type PayslipStatus = "released" | "in-progress";

export type MoneyValue = number | string;

export type EmployeePayslipDeduction = {
  label: string;
  amount: MoneyValue;
};

export type EmployeePayslip = {
  id: string;
  payrollPeriod: string;
  payrollMonth: string;
  payrollMonthKey: string;
  dateReleased: string | null;
  payFrequency: string;
  monthlyBasicSalary: MoneyValue | null;
  cutoffBasicPay: MoneyValue | null;
  referenceDailyRate: MoneyValue | null;
  earnings: {
    basicPay: MoneyValue | null;
    totalEarnings: MoneyValue | null;
  };
  deductions: readonly EmployeePayslipDeduction[];
  totalDeductions: MoneyValue | null;
  netPay: MoneyValue | null;
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
  monthlyBasicSalary: MoneyValue | null;
  referenceDailyRate: MoneyValue | null;
  totalEarnings: MoneyValue | null;
  totalDeductions: MoneyValue | null;
  netPay: MoneyValue | null;
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
