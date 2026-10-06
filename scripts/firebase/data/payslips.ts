import { demoEmployeeSeedAccounts } from "./demo-employees";

export type SeedPayrollMonthlySummary = {
  id: string;
  monthKey: string;
  monthLabel: string;
  releasedCutoffCount: number;
  totalCutoffCount: number;
  monthlyBasicSalary: number;
  referenceDailyRate: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  status: "complete" | "in-progress";
  includedPayslipIds: string[];
};

export type SeedPayrollPayslip = {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  payFrequency: "Semi-monthly";
  monthlyBasicSalary: number;
  cutoffBasicPay: number | null;
  referenceDailyRate: number;
  basicPay: number | null;
  grossPay: number | null;
  deductions: Array<{ label: string; amount: number }>;
  totalDeductions: number | null;
  netPay: number | null;
  status: "released" | "in-progress";
  releasedAt: string | null;
  source: "PAYROLL_SYSTEM";
  payrollReference: string;
  dataSource: "development-seed";
  monthlySummary: SeedPayrollMonthlySummary;
};

const releasedPayrollFields = {
  monthlyBasicSalary: 22000,
  cutoffBasicPay: 11000,
  referenceDailyRate: 846.15,
  basicPay: 11000,
  grossPay: 11000,
  deductions: [
    { label: "SSS", amount: 550 },
    { label: "PhilHealth", amount: 275 },
    { label: "Pag-IBIG", amount: 100 },
    { label: "Withholding Tax", amount: 0 },
  ],
  totalDeductions: 925,
  netPay: 10075,
  status: "released" as const,
  source: "PAYROLL_SYSTEM" as const,
  dataSource: "development-seed" as const,
};

const inProgressPayrollFields = {
  monthlyBasicSalary: 22000,
  cutoffBasicPay: null,
  referenceDailyRate: 846.15,
  basicPay: null,
  grossPay: null,
  deductions: [],
  totalDeductions: null,
  netPay: null,
  status: "in-progress" as const,
  source: "PAYROLL_SYSTEM" as const,
  dataSource: "development-seed" as const,
};

function getSeptemberSummary(employeeId: string): SeedPayrollMonthlySummary {
  return {
    id: `monthly-${employeeId}-2026-09`,
    monthKey: "2026-09",
    monthLabel: "September 2026",
    releasedCutoffCount: 1,
    totalCutoffCount: 2,
    monthlyBasicSalary: 22000,
    referenceDailyRate: 846.15,
    totalEarnings: 11000,
    totalDeductions: 925,
    netPay: 10075,
    status: "in-progress",
    includedPayslipIds: [`payslip-${employeeId}-2026-09-01`],
  };
}

function getAugustSummary(employeeId: string): SeedPayrollMonthlySummary {
  return {
    id: `monthly-${employeeId}-2026-08`,
    monthKey: "2026-08",
    monthLabel: "August 2026",
    releasedCutoffCount: 2,
    totalCutoffCount: 2,
    monthlyBasicSalary: 22000,
    referenceDailyRate: 846.15,
    totalEarnings: 22000,
    totalDeductions: 1850,
    netPay: 20150,
    status: "complete",
    includedPayslipIds: [
      `payslip-${employeeId}-2026-08-16`,
      `payslip-${employeeId}-2026-08-01`,
    ],
  };
}

export const payrollPayslipSeedData: readonly SeedPayrollPayslip[] =
  demoEmployeeSeedAccounts.flatMap(({ employeeId }) => {
    const septemberSummary = getSeptemberSummary(employeeId);
    const augustSummary = getAugustSummary(employeeId);

    return [
      {
        id: `payslip-${employeeId}-2026-09-16`,
        employeeId,
        periodStart: "2026-09-16",
        periodEnd: "2026-09-30",
        payFrequency: "Semi-monthly" as const,
        ...inProgressPayrollFields,
        releasedAt: null,
        payrollReference: `PAY-${employeeId}-2026-09-16`,
        monthlySummary: septemberSummary,
      },
      {
        id: `payslip-${employeeId}-2026-09-01`,
        employeeId,
        periodStart: "2026-09-01",
        periodEnd: "2026-09-15",
        payFrequency: "Semi-monthly" as const,
        ...releasedPayrollFields,
        releasedAt: "2026-09-18T08:00:00.000Z",
        payrollReference: `PAY-${employeeId}-2026-09-01`,
        monthlySummary: septemberSummary,
      },
      {
        id: `payslip-${employeeId}-2026-08-16`,
        employeeId,
        periodStart: "2026-08-16",
        periodEnd: "2026-08-31",
        payFrequency: "Semi-monthly" as const,
        ...releasedPayrollFields,
        releasedAt: "2026-09-03T08:00:00.000Z",
        payrollReference: `PAY-${employeeId}-2026-08-16`,
        monthlySummary: augustSummary,
      },
      {
        id: `payslip-${employeeId}-2026-08-01`,
        employeeId,
        periodStart: "2026-08-01",
        periodEnd: "2026-08-15",
        payFrequency: "Semi-monthly" as const,
        ...releasedPayrollFields,
        releasedAt: "2026-08-18T08:00:00.000Z",
        payrollReference: `PAY-${employeeId}-2026-08-01`,
        monthlySummary: augustSummary,
      },
    ];
  });
