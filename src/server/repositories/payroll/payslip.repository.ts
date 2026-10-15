import "server-only";

import {
  listPrismaPayslipsByEmployee,
  upsertPrismaPayslipFromResult,
  type PrismaPayslipView,
} from "@/server/repositories/payroll/prisma-payslip.repository";
import {
  getDisabledLegacyStore as getFirebaseAdminDb,
  legacyFieldValue as FieldValue,
  RepositoryTimestamp as Timestamp,
  type DocumentData,
  toRepositoryTimestamp,
  toRepositoryRecord,
} from "@/server/repositories/prisma/prisma-compat";
import type { MoneyValue } from "@/types/payslip";

const payslipCollection = "payrollPayslips";

export type StoredPayslipStatus = "released" | "in-progress";

export type StoredPayslipDeduction = {
  label: string;
  amount: MoneyValue;
};

export type StoredPayrollMonthlySummary = {
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
  status: "complete" | "in-progress";
  includedPayslipIds: string[];
};

export type StoredPayrollPayslip = {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  payFrequency: string;
  monthlyBasicSalary: MoneyValue | null;
  cutoffBasicPay: MoneyValue | null;
  referenceDailyRate: MoneyValue | null;
  basicPay: MoneyValue | null;
  grossPay: MoneyValue | null;
  deductions: StoredPayslipDeduction[];
  totalDeductions: MoneyValue | null;
  netPay: MoneyValue | null;
  status: StoredPayslipStatus;
  releasedAt: Timestamp | null;
  source: "PAYROLL_SYSTEM";
  payrollReference: string;
  monthlySummary: StoredPayrollMonthlySummary;
};

export type PayrollResultPayslipUpsert = {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  payrollReference: string;
  releasedAt: string;
  monthlyBasicSalary?: MoneyValue | null;
  cutoffBasicPay?: MoneyValue | null;
  referenceDailyRate?: MoneyValue | null;
  basicPay?: MoneyValue | null;
  grossPay?: MoneyValue | null;
  deductions?: StoredPayslipDeduction[];
  totalDeductions?: MoneyValue | null;
  netPay?: MoneyValue | null;
};

export class PayslipDataError extends Error {
  readonly code = "PAYSLIP_DATA_INVALID";

  constructor() {
    super("The payroll payslip record has an invalid shape.");
    this.name = "PayslipDataError";
  }
}

function toMoneyValue(value: unknown): MoneyValue | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value.trim())) {
    return value.trim();
  }
  return null;
}

function toStoredPrismaPayslip(record: PrismaPayslipView): StoredPayrollPayslip {
  const monthly = toRepositoryRecord(record.monthlySummary);
  const monthKey = record.periodStart.slice(0, 7);
  return {
    id: record.legacyId ?? record.internalId,
    employeeId: record.employeeId,
    periodStart: record.periodStart,
    periodEnd: record.periodEnd,
    payFrequency: record.payFrequency,
    monthlyBasicSalary: toMoneyValue(record.monthlyBasicSalary),
    cutoffBasicPay: toMoneyValue(record.cutoffBasicPay),
    referenceDailyRate: toMoneyValue(record.referenceDailyRate),
    basicPay: toMoneyValue(record.basicPay),
    grossPay: toMoneyValue(record.grossPay),
    deductions: record.deductions.flatMap((value) => {
      const deduction = toRepositoryRecord(value);
      const amount = toMoneyValue(deduction.amount);
      return typeof deduction.label === "string" && amount !== null
        ? [{ label: deduction.label, amount }]
        : [];
    }),
    totalDeductions: toMoneyValue(record.totalDeductions),
    netPay: toMoneyValue(record.netPay),
    status: record.status,
    releasedAt: toRepositoryTimestamp(record.releasedAt),
    source: "PAYROLL_SYSTEM",
    payrollReference: record.payrollReference,
    monthlySummary: {
      id: typeof monthly.id === "string" ? monthly.id : `monthly-${record.employeeId}-${monthKey}`,
      monthKey: typeof monthly.monthKey === "string" ? monthly.monthKey : monthKey,
      monthLabel: typeof monthly.monthLabel === "string" ? monthly.monthLabel : formatResultMonthLabel(monthKey),
      releasedCutoffCount: typeof monthly.releasedCutoffCount === "number" ? monthly.releasedCutoffCount : 1,
      totalCutoffCount: typeof monthly.totalCutoffCount === "number" ? monthly.totalCutoffCount : 1,
      monthlyBasicSalary: toMoneyValue(monthly.monthlyBasicSalary ?? record.monthlyBasicSalary),
      referenceDailyRate: toMoneyValue(monthly.referenceDailyRate ?? record.referenceDailyRate),
      totalEarnings: toMoneyValue(monthly.totalEarnings ?? record.grossPay),
      totalDeductions: toMoneyValue(monthly.totalDeductions ?? record.totalDeductions),
      netPay: toMoneyValue(monthly.netPay ?? record.netPay),
      status: monthly.status === "in-progress" ? "in-progress" : "complete",
      includedPayslipIds: Array.isArray(monthly.includedPayslipIds)
        ? monthly.includedPayslipIds.filter((value): value is string => typeof value === "string")
        : [record.legacyId ?? record.internalId],
    },
  };
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

  const deductions: Array<StoredPayslipDeduction | null> = value.map((item) => {
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
  const result = await listPrismaPayslipsByEmployee({ employeeId, page: 1, pageSize: 100 });
  return result.rows.map(toStoredPrismaPayslip);

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
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

function formatResultMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export async function upsertPayrollPayslipFromResult(
  input: PayrollResultPayslipUpsert,
): Promise<void> {
  await upsertPrismaPayslipFromResult(input);
  return;

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const reference = getFirebaseAdminDb().collection(payslipCollection).doc(input.id);
  const releasedAt = Timestamp.fromDate(new Date(input.releasedAt));
  const monthKey = input.periodStart.slice(0, 7);
  const monthlySummary: StoredPayrollMonthlySummary = {
    id: `monthly-${input.employeeId}-${monthKey}`,
    monthKey,
    monthLabel: formatResultMonthLabel(monthKey),
    releasedCutoffCount: 1,
    totalCutoffCount: 1,
    monthlyBasicSalary: input.monthlyBasicSalary ?? null,
    referenceDailyRate: input.referenceDailyRate ?? null,
    totalEarnings: input.grossPay ?? null,
    totalDeductions: input.totalDeductions ?? null,
    netPay: input.netPay ?? null,
    status: "complete",
    includedPayslipIds: [input.id],
  };
  const data: DocumentData = {
    employeeId: input.employeeId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    payFrequency: "Semi-monthly",
    monthlyBasicSalary: input.monthlyBasicSalary ?? null,
    cutoffBasicPay: input.cutoffBasicPay ?? null,
    referenceDailyRate: input.referenceDailyRate ?? null,
    basicPay: input.basicPay ?? null,
    grossPay: input.grossPay ?? null,
    deductions: input.deductions ?? [],
    totalDeductions: input.totalDeductions ?? null,
    netPay: input.netPay ?? null,
    status: "released",
    releasedAt,
    source: "PAYROLL_SYSTEM",
    payrollReference: input.payrollReference,
    dataSource: "integration-result",
    monthlySummary,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await getFirebaseAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (snapshot.exists) {
      const existing = parsePayslipRecord(snapshot.id, snapshot.data());
      if (!existing || existing.employeeId !== input.employeeId) {
        throw new PayslipDataError();
      }
      transaction.set(reference, data, { merge: true });
      return;
    }

    transaction.create(reference, {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}
