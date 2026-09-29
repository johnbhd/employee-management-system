import type { IconName, StatusTone } from "@/types/ui";

export type EmployeePayslipStatus = "released" | "in-progress";

export type EmployeePayslipDeduction = {
  label: string;
  amount: string;
};

export type EmployeePayslip = {
  id: string;
  payrollPeriod: string;
  payrollMonth: string;
  dateReleased: string | null;
  payFrequency: "Semi-monthly";
  monthlyBasicSalary: string;
  cutoffBasicPay: string | null;
  referenceDailyRate: string;
  earnings: {
    basicPay: string | null;
    totalEarnings: string | null;
  };
  deductions: readonly EmployeePayslipDeduction[];
  totalDeductions: string | null;
  netPay: string | null;
  status: EmployeePayslipStatus;
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
  monthlyBasicSalary: string;
  referenceDailyRate: string;
  totalEarnings: string | null;
  totalDeductions: string | null;
  netPay: string | null;
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

const standardDeductions: readonly EmployeePayslipDeduction[] = [
  { label: "SSS", amount: "₱550.00" },
  { label: "PhilHealth", amount: "₱275.00" },
  { label: "Pag-IBIG", amount: "₱100.00" },
  { label: "Withholding Tax", amount: "₱0.00" },
];

const standardReleasedPayroll = {
  payFrequency: "Semi-monthly" as const,
  monthlyBasicSalary: "₱22,000.00",
  cutoffBasicPay: "₱11,000.00",
  referenceDailyRate: "₱846.15",
  earnings: {
    basicPay: "₱11,000.00",
    totalEarnings: "₱11,000.00",
  },
  deductions: standardDeductions,
  totalDeductions: "₱925.00",
  netPay: "₱10,075.00",
  status: "released" as const,
  statusLabel: "Released",
  statusTone: "success" as const,
};

const inProgressPayroll = {
  payFrequency: "Semi-monthly" as const,
  monthlyBasicSalary: "₱22,000.00",
  cutoffBasicPay: null,
  referenceDailyRate: "₱846.15",
  earnings: {
    basicPay: null,
    totalEarnings: null,
  },
  deductions: [],
  totalDeductions: null,
  netPay: null,
  status: "in-progress" as const,
  statusLabel: "In Progress",
  statusTone: "warning" as const,
};

export const employeePayslipCutoffStats: readonly EmployeePayslipStat[] = [
  {
    label: "Total Earnings",
    value: "₱11,000.00",
    note: "This Cutoff",
    icon: "payroll",
    tone: "blue",
  },
  {
    label: "Total Deductions",
    value: "₱925.00",
    note: "This Cutoff",
    icon: "arrow",
    tone: "red",
  },
  {
    label: "Net Pay",
    value: "₱10,075.00",
    note: "This Cutoff",
    icon: "info",
    tone: "green",
  },
  {
    label: "Latest Payslip",
    value: "September 1 – 15, 2026",
    note: "Released Sep 18, 2026",
    icon: "calendar",
    tone: "purple",
  },
];

export const employeePayslipMonthlyStats: readonly EmployeePayslipStat[] = [
  {
    label: "Total Earnings",
    value: "₱11,000.00",
    note: "Released So Far",
    icon: "payroll",
    tone: "blue",
  },
  {
    label: "Total Deductions",
    value: "₱925.00",
    note: "Released So Far",
    icon: "arrow",
    tone: "red",
  },
  {
    label: "Net Pay",
    value: "₱10,075.00",
    note: "Released So Far",
    icon: "info",
    tone: "green",
  },
  {
    label: "Payroll Month",
    value: "September 2026",
    note: "1 of 2 Cutoffs Released",
    icon: "calendar",
    tone: "purple",
  },
];

export const employeePayslips: readonly EmployeePayslip[] = [
  {
    id: "payslip-2026-09-16",
    payrollPeriod: "September 16 – 30, 2026",
    payrollMonth: "September 2026",
    dateReleased: null,
    ...inProgressPayroll,
  },
  {
    id: "payslip-2026-09-01",
    payrollPeriod: "September 1 – 15, 2026",
    payrollMonth: "September 2026",
    dateReleased: "Sep 18, 2026",
    ...standardReleasedPayroll,
  },
  {
    id: "payslip-2026-08-16",
    payrollPeriod: "August 16 – 31, 2026",
    payrollMonth: "August 2026",
    dateReleased: "Sep 3, 2026",
    ...standardReleasedPayroll,
  },
  {
    id: "payslip-2026-08-01",
    payrollPeriod: "August 1 – 15, 2026",
    payrollMonth: "August 2026",
    dateReleased: "Aug 18, 2026",
    ...standardReleasedPayroll,
  },
  {
    id: "payslip-2026-07-16",
    payrollPeriod: "July 16 – 31, 2026",
    payrollMonth: "July 2026",
    dateReleased: "Aug 3, 2026",
    ...standardReleasedPayroll,
  },
  {
    id: "payslip-2026-07-01",
    payrollPeriod: "July 1 – 15, 2026",
    payrollMonth: "July 2026",
    dateReleased: "Jul 18, 2026",
    ...standardReleasedPayroll,
  },
  {
    id: "payslip-2026-06-16",
    payrollPeriod: "June 16 – 30, 2026",
    payrollMonth: "June 2026",
    dateReleased: "Jul 3, 2026",
    ...standardReleasedPayroll,
  },
  {
    id: "payslip-2026-06-01",
    payrollPeriod: "June 1 – 15, 2026",
    payrollMonth: "June 2026",
    dateReleased: "Jun 18, 2026",
    ...standardReleasedPayroll,
  },
  {
    id: "payslip-2026-05-16",
    payrollPeriod: "May 16 – 31, 2026",
    payrollMonth: "May 2026",
    dateReleased: "Jun 3, 2026",
    ...standardReleasedPayroll,
  },
  {
    id: "payslip-2026-05-01",
    payrollPeriod: "May 1 – 15, 2026",
    payrollMonth: "May 2026",
    dateReleased: "May 18, 2026",
    ...standardReleasedPayroll,
  },
];

export const employeeMonthlyPayslips: readonly EmployeeMonthlyPayslip[] = [
  {
    id: "monthly-payslip-2026-09",
    monthKey: "2026-09",
    monthLabel: "September 2026",
    releasedCutoffCount: 1,
    totalCutoffCount: 2,
    monthlyBasicSalary: "₱22,000.00",
    referenceDailyRate: "₱846.15",
    totalEarnings: "₱11,000.00",
    totalDeductions: "₱925.00",
    netPay: "₱10,075.00",
    status: "in-progress",
    statusLabel: "In Progress",
    statusTone: "warning",
    includedPayslipIds: ["payslip-2026-09-01"],
  },
  {
    id: "monthly-payslip-2026-08",
    monthKey: "2026-08",
    monthLabel: "August 2026",
    releasedCutoffCount: 2,
    totalCutoffCount: 2,
    monthlyBasicSalary: "₱22,000.00",
    referenceDailyRate: "₱846.15",
    totalEarnings: "₱22,000.00",
    totalDeductions: "₱1,850.00",
    netPay: "₱20,150.00",
    status: "complete",
    statusLabel: "Complete",
    statusTone: "success",
    includedPayslipIds: ["payslip-2026-08-16", "payslip-2026-08-01"],
  },
  {
    id: "monthly-payslip-2026-07",
    monthKey: "2026-07",
    monthLabel: "July 2026",
    releasedCutoffCount: 2,
    totalCutoffCount: 2,
    monthlyBasicSalary: "₱22,000.00",
    referenceDailyRate: "₱846.15",
    totalEarnings: "₱22,000.00",
    totalDeductions: "₱1,850.00",
    netPay: "₱20,150.00",
    status: "complete",
    statusLabel: "Complete",
    statusTone: "success",
    includedPayslipIds: ["payslip-2026-07-16", "payslip-2026-07-01"],
  },
  {
    id: "monthly-payslip-2026-06",
    monthKey: "2026-06",
    monthLabel: "June 2026",
    releasedCutoffCount: 2,
    totalCutoffCount: 2,
    monthlyBasicSalary: "₱22,000.00",
    referenceDailyRate: "₱846.15",
    totalEarnings: "₱22,000.00",
    totalDeductions: "₱1,850.00",
    netPay: "₱20,150.00",
    status: "complete",
    statusLabel: "Complete",
    statusTone: "success",
    includedPayslipIds: ["payslip-2026-06-16", "payslip-2026-06-01"],
  },
  {
    id: "monthly-payslip-2026-05",
    monthKey: "2026-05",
    monthLabel: "May 2026",
    releasedCutoffCount: 2,
    totalCutoffCount: 2,
    monthlyBasicSalary: "₱22,000.00",
    referenceDailyRate: "₱846.15",
    totalEarnings: "₱22,000.00",
    totalDeductions: "₱1,850.00",
    netPay: "₱20,150.00",
    status: "complete",
    statusLabel: "Complete",
    statusTone: "success",
    includedPayslipIds: ["payslip-2026-05-16", "payslip-2026-05-01"],
  },
];

export const employeePayslipYears = ["2026"] as const;
