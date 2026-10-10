import "server-only";

import type { DocumentData } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/server";

const payslipCollection = "payrollPayslips";

export type StoredPayslipStatus = "released" | "in-progress";

export type StoredPayslipDeduction = {
  label: string;
  amount: number;
};

export type StoredPayrollMonthlySummary = {
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
  status: "complete" | "in-progress";
  includedPayslipIds: string[];
};

export type StoredPayrollPayslip = {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  payFrequency: string;
  monthlyBasicSalary: number | null;
  cutoffBasicPay: number | null;
  referenceDailyRate: number | null;
  basicPay: number | null;
  grossPay: number | null;
  deductions: StoredPayslipDeduction[];
  totalDeductions: number | null;
  netPay: number | null;
  status: StoredPayslipStatus;
  releasedAt: Timestamp | null;
  source: "PAYROLL_SYSTEM";
  payrollReference: string;
  monthlySummary: StoredPayrollMonthlySummary;
};

export class PayslipDataError extends Error {
  readonly code = "PAYSLIP_DATA_INVALID";

  constructor() {
    super("The payroll payslip record has an invalid shape.");
    this.name = "PayslipDataError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRequiredString(
  data: Record<string, unknown>,
  field: string,
): string | null {
  const value = data[field];

  return typeof value === "string" && value.trim() ? value : null;
}

function getNullableString(
  data: Record<string, unknown>,
  field: string,
): string | null | undefined {
  const value = data[field];

  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === "string" && value.trim() ? value : undefined;
}

function getFiniteNumber(
  data: Record<string, unknown>,
  field: string,
): number | null | undefined {
  const value = data[field];

  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getTimestamp(
  data: Record<string, unknown>,
  field: string,
): Timestamp | null | undefined {
  const value = data[field];

  if (value === null || value === undefined) {
    return null;
  }

  return value instanceof Timestamp ? value : undefined;
}

function getDateKey(
  data: Record<string, unknown>,
  field: string,
): string | null {
  const value = getRequiredString(data, field);

  return value && /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)
    ? value
    : null;
}

function parseDeductions(value: unknown): StoredPayslipDeduction[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const deductions = value.map((item) => {
    if (!isRecord(item)) {
      return null;
    }

    const label = getRequiredString(item, "label");
    const amount = getFiniteNumber(item, "amount");

    return label && amount !== undefined && amount !== null
      ? { label, amount }
      : null;
  });

  return deductions.every((deduction): deduction is StoredPayslipDeduction => deduction !== null)
    ? deductions
    : null;
}

function parseMonthlySummary(value: unknown): StoredPayrollMonthlySummary | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = getRequiredString(value, "id");
  const monthKey = getRequiredString(value, "monthKey");
  const monthLabel = getRequiredString(value, "monthLabel");
  const releasedCutoffCount = getFiniteNumber(value, "releasedCutoffCount");
  const totalCutoffCount = getFiniteNumber(value, "totalCutoffCount");
  const monthlyBasicSalary = getFiniteNumber(value, "monthlyBasicSalary");
  const referenceDailyRate = getFiniteNumber(value, "referenceDailyRate");
  const totalEarnings = getFiniteNumber(value, "totalEarnings");
  const totalDeductions = getFiniteNumber(value, "totalDeductions");
  const netPay = getFiniteNumber(value, "netPay");
  const status = value.status;
  const includedPayslipIds = value.includedPayslipIds;

  if (
    !id
    || !monthKey
    || !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)
    || !monthLabel
    || releasedCutoffCount === undefined
    || releasedCutoffCount === null
    || totalCutoffCount === undefined
    || totalCutoffCount === null
    || monthlyBasicSalary === undefined
    || referenceDailyRate === undefined
    || totalEarnings === undefined
    || totalDeductions === undefined
    || netPay === undefined
    || (status !== "complete" && status !== "in-progress")
    || !Array.isArray(includedPayslipIds)
    || includedPayslipIds.some((item) => typeof item !== "string" || !item.trim())
  ) {
    return null;
  }

  return {
    id,
    monthKey,
    monthLabel,
    releasedCutoffCount,
    totalCutoffCount,
    monthlyBasicSalary,
    referenceDailyRate,
    totalEarnings,
    totalDeductions,
    netPay,
    status,
    includedPayslipIds,
  };
}

function parsePayslipRecord(
  id: string,
  data: DocumentData | undefined,
): StoredPayrollPayslip | null {
  if (!data) {
    return null;
  }

  const employeeId = getRequiredString(data, "employeeId");
  const periodStart = getDateKey(data, "periodStart");
  const periodEnd = getDateKey(data, "periodEnd");
  const payFrequency = getRequiredString(data, "payFrequency");
  const monthlyBasicSalary = getFiniteNumber(data, "monthlyBasicSalary");
  const cutoffBasicPay = getFiniteNumber(data, "cutoffBasicPay");
  const referenceDailyRate = getFiniteNumber(data, "referenceDailyRate");
  const basicPay = getFiniteNumber(data, "basicPay");
  const grossPay = getFiniteNumber(data, "grossPay");
  const deductions = parseDeductions(data.deductions);
  const totalDeductions = getFiniteNumber(data, "totalDeductions");
  const netPay = getFiniteNumber(data, "netPay");
  const status = data.status;
  const releasedAt = getTimestamp(data, "releasedAt");
  const source = data.source;
  const payrollReference = getRequiredString(data, "payrollReference");
  const monthlySummary = parseMonthlySummary(data.monthlySummary);

  if (
    !employeeId
    || !periodStart
    || !periodEnd
    || !payFrequency
    || monthlyBasicSalary === undefined
    || cutoffBasicPay === undefined
    || referenceDailyRate === undefined
    || basicPay === undefined
    || grossPay === undefined
    || !deductions
    || totalDeductions === undefined
    || netPay === undefined
    || (status !== "released" && status !== "in-progress")
    || releasedAt === undefined
    || source !== "PAYROLL_SYSTEM"
    || !payrollReference
    || !monthlySummary
  ) {
    return null;
  }

  return {
    id,
    employeeId,
    periodStart,
    periodEnd,
    payFrequency,
    monthlyBasicSalary,
    cutoffBasicPay,
    referenceDailyRate,
    basicPay,
    grossPay,
    deductions,
    totalDeductions,
    netPay,
    status,
    releasedAt,
    source,
    payrollReference,
    monthlySummary,
  };
}

export async function listPayslipsByEmployee(
  employeeId: string,
): Promise<StoredPayrollPayslip[]> {
  const snapshots = await getFirebaseAdminDb()
    .collection(payslipCollection)
    .where("employeeId", "==", employeeId)
    .get();

  return snapshots.docs
    .map((snapshot) => {
      const record = parsePayslipRecord(snapshot.id, snapshot.data());

      if (!record || record.employeeId !== employeeId) {
        throw new PayslipDataError();
      }

      return record;
    })
    .sort((left, right) => {
      const periodOrder = right.periodEnd.localeCompare(left.periodEnd);

      return periodOrder || right.id.localeCompare(left.id);
    });
}
