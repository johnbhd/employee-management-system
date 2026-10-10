import "server-only";

import { formatCampusDate, formatCampusMonthYear } from "@/lib/campus-time";
import { formatPhilippinePeso } from "@/lib/format-currency";
import {
  listPayslipsByEmployee,
  type StoredPayrollMonthlySummary,
  type StoredPayrollPayslip,
} from "@/server/repositories/payroll/payslip.repository";
import type {
  EmployeeMonthlyPayslip,
  EmployeePayslip,
  EmployeePayslipHistoryData,
  EmployeePayslipStat,
} from "@/types/payslip";

const periodMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  timeZone: "UTC",
});

const periodDayFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  timeZone: "UTC",
});

const emptyAmount = "\u2014";

function getDateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function formatPayrollPeriod(periodStart: string, periodEnd: string): string {
  const startDate = getDateFromKey(periodStart);
  const endDate = getDateFromKey(periodEnd);
  const month = periodMonthFormatter.format(startDate);
  const startDay = periodDayFormatter.format(startDate);
  const endDay = periodDayFormatter.format(endDate);
  const year = endDate.getUTCFullYear();

  return `${month} ${startDay} - ${endDay}, ${year}`;
}

function formatAmount(value: number | null): string {
  return value === null ? emptyAmount : formatPhilippinePeso(value);
}

function toPayslip(record: StoredPayrollPayslip): EmployeePayslip {
  const periodStartDate = getDateFromKey(record.periodStart);

  return {
    id: record.id,
    payrollPeriod: formatPayrollPeriod(record.periodStart, record.periodEnd),
    payrollMonth: formatCampusMonthYear(periodStartDate),
    payrollMonthKey: record.periodStart.slice(0, 7),
    dateReleased: record.releasedAt ? formatCampusDate(record.releasedAt.toDate()) : null,
    payFrequency: record.payFrequency,
    monthlyBasicSalary: record.monthlyBasicSalary,
    cutoffBasicPay: record.cutoffBasicPay,
    referenceDailyRate: record.referenceDailyRate,
    earnings: {
      basicPay: record.basicPay,
      totalEarnings: record.grossPay,
    },
    deductions: record.deductions,
    totalDeductions: record.totalDeductions,
    netPay: record.netPay,
    status: record.status,
    statusLabel: record.status === "released" ? "Released" : "In Progress",
    statusTone: record.status === "released" ? "success" : "warning",
  };
}

function toMonthlyPayslip(
  summary: StoredPayrollMonthlySummary,
): EmployeeMonthlyPayslip {
  return {
    id: summary.id,
    monthKey: summary.monthKey,
    monthLabel: summary.monthLabel,
    releasedCutoffCount: summary.releasedCutoffCount,
    totalCutoffCount: summary.totalCutoffCount,
    monthlyBasicSalary: summary.monthlyBasicSalary,
    referenceDailyRate: summary.referenceDailyRate,
    totalEarnings: summary.totalEarnings,
    totalDeductions: summary.totalDeductions,
    netPay: summary.netPay,
    status: summary.status,
    statusLabel: summary.status === "complete" ? "Complete" : "In Progress",
    statusTone: summary.status === "complete" ? "success" : "warning",
    includedPayslipIds: summary.includedPayslipIds,
  };
}

function getCutoffStats(
  payslips: readonly EmployeePayslip[],
): readonly EmployeePayslipStat[] {
  const latestPayslip = payslips[0] ?? null;
  const latestReleased = payslips.find((payslip) => payslip.status === "released") ?? null;

  return [
    {
      label: "Total Earnings",
      value: formatAmount(latestReleased?.earnings.totalEarnings ?? null),
      note: latestReleased ? "Latest released cutoff" : "No released records",
      icon: "payroll",
      tone: "blue",
    },
    {
      label: "Total Deductions",
      value: formatAmount(latestReleased?.totalDeductions ?? null),
      note: latestReleased ? "Latest released cutoff" : "No released records",
      icon: "arrow",
      tone: "red",
    },
    {
      label: "Net Pay",
      value: formatAmount(latestReleased?.netPay ?? null),
      note: latestReleased ? "Latest released cutoff" : "No released records",
      icon: "info",
      tone: "green",
    },
    {
      label: "Latest Payslip",
      value: latestPayslip?.payrollPeriod ?? "No records",
      note: latestPayslip?.dateReleased
        ? `Released ${latestPayslip.dateReleased}`
        : "Payroll record pending release",
      icon: "calendar",
      tone: "purple",
    },
  ];
}

function getMonthlyStats(
  monthlyPayslips: readonly EmployeeMonthlyPayslip[],
): readonly EmployeePayslipStat[] {
  const latest = monthlyPayslips[0] ?? null;

  return [
    {
      label: "Total Earnings",
      value: formatAmount(latest?.totalEarnings ?? null),
      note: latest ? "Released so far" : "No payroll month records",
      icon: "payroll",
      tone: "blue",
    },
    {
      label: "Total Deductions",
      value: formatAmount(latest?.totalDeductions ?? null),
      note: latest ? "Released so far" : "No payroll month records",
      icon: "arrow",
      tone: "red",
    },
    {
      label: "Net Pay",
      value: formatAmount(latest?.netPay ?? null),
      note: latest ? "Released so far" : "No payroll month records",
      icon: "info",
      tone: "green",
    },
    {
      label: "Payroll Month",
      value: latest?.monthLabel ?? "No records",
      note: latest
        ? `${latest.releasedCutoffCount} of ${latest.totalCutoffCount} cutoffs released`
        : "No payroll month records",
      icon: "calendar",
      tone: "purple",
    },
  ];
}

export async function getEmployeePayslipHistoryForEmployee(
  employeeId: string,
): Promise<EmployeePayslipHistoryData> {
  const records = await listPayslipsByEmployee(employeeId);
  const payslips = records.map(toPayslip);
  const monthlySummaryById = new Map<string, StoredPayrollMonthlySummary>();

  for (const record of records) {
    monthlySummaryById.set(record.monthlySummary.id, record.monthlySummary);
  }

  const monthlyPayslips = Array.from(monthlySummaryById.values())
    .sort((left, right) => right.monthKey.localeCompare(left.monthKey))
    .map(toMonthlyPayslip);
  const years = Array.from(
    new Set(payslips.map((payslip) => payslip.payrollMonthKey.slice(0, 4))),
  ).sort((left, right) => right.localeCompare(left));

  return {
    payslips,
    monthlyPayslips,
    years,
    cutoffStats: getCutoffStats(payslips),
    monthlyStats: getMonthlyStats(monthlyPayslips),
  };
}
