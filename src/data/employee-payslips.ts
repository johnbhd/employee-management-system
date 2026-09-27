import type { IconName, StatusTone } from "@/types/ui";

export type EmployeePayslipStatus = "released";

export type EmployeePayslip = {
  id: string;
  payrollPeriod: string;
  dateReleased: string;
  basicPay: string;
  deductions: string;
  netPay: string;
  status: EmployeePayslipStatus;
  statusLabel: string;
  statusTone: StatusTone;
};

export type EmployeePayslipStat = {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: "blue" | "red" | "green" | "purple";
};

export const employeePayslipStats: readonly EmployeePayslipStat[] = [
  { label: "Total Earnings", value: "₱ 26,000.00", note: "This Period", icon: "payroll", tone: "blue" },
  { label: "Total Deductions", value: "₱ 4,850.00", note: "This Period", icon: "arrow", tone: "red" },
  { label: "Net Pay", value: "₱ 21,150.00", note: "This Period", icon: "info", tone: "green" },
  { label: "Latest Payslip", value: "July 1 – 15, 2026", note: "Released Jul 18, 2026", icon: "calendar", tone: "purple" },
];

export const employeePayslips: readonly EmployeePayslip[] = [
  {
    id: "payslip-2026-07-01",
    payrollPeriod: "July 1 – 15, 2026",
    dateReleased: "Jul 18, 2026",
    basicPay: "₱ 26,000.00",
    deductions: "₱ 4,850.00",
    netPay: "₱ 21,150.00",
    status: "released",
    statusLabel: "Released",
    statusTone: "success",
  },
  {
    id: "payslip-2026-06-16",
    payrollPeriod: "June 16 – 30, 2026",
    dateReleased: "Jul 3, 2026",
    basicPay: "₱ 26,000.00",
    deductions: "₱ 4,750.00",
    netPay: "₱ 21,250.00",
    status: "released",
    statusLabel: "Released",
    statusTone: "success",
  },
  {
    id: "payslip-2026-06-01",
    payrollPeriod: "June 1 – 15, 2026",
    dateReleased: "Jun 18, 2026",
    basicPay: "₱ 26,000.00",
    deductions: "₱ 4,900.00",
    netPay: "₱ 21,100.00",
    status: "released",
    statusLabel: "Released",
    statusTone: "success",
  },
  {
    id: "payslip-2026-05-16",
    payrollPeriod: "May 16 – 31, 2026",
    dateReleased: "Jun 3, 2026",
    basicPay: "₱ 25,500.00",
    deductions: "₱ 4,800.00",
    netPay: "₱ 20,700.00",
    status: "released",
    statusLabel: "Released",
    statusTone: "success",
  },
  {
    id: "payslip-2026-05-01",
    payrollPeriod: "May 1 – 15, 2026",
    dateReleased: "May 18, 2026",
    basicPay: "₱ 25,500.00",
    deductions: "₱ 4,750.00",
    netPay: "₱ 20,750.00",
    status: "released",
    statusLabel: "Released",
    statusTone: "success",
  },
];

export const employeePayslipYears = ["2026"] as const;
export const employeePayslipRecordCount = 28;
