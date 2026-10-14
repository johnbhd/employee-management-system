import "server-only";

import { Prisma } from "@prisma/client";

import {
    getRepositoryPrisma,
    toDateKey,
    toDecimalString,
    toJson,
    toJsonArray,
    toJsonObject,
    toIso,
} from "@/server/repositories/prisma/prisma-repository-helpers";

export type PrismaPayslipView = {
    internalId: string;
    legacyId: string | null;
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    payFrequency: string;
    monthlyBasicSalary: string | null;
    cutoffBasicPay: string | null;
    referenceDailyRate: string | null;
    basicPay: string | null;
    grossPay: string | null;
    deductions: unknown[];
    totalDeductions: string | null;
    netPay: string | null;
    status: "released" | "in-progress";
    releasedAt: string | null;
    source: string;
    payrollReference: string;
    monthlySummary: Record<string, unknown>;
};

const payslipSelect = {
    id: true,
    legacyFirestoreId: true,
    periodStart: true,
    periodEnd: true,
    payFrequency: true,
    monthlyBasicSalary: true,
    cutoffBasicPay: true,
    referenceDailyRate: true,
    basicPay: true,
    grossPay: true,
    deductions: true,
    totalDeductions: true,
    netPay: true,
    status: true,
    releasedAt: true,
    source: true,
    payrollReference: true,
    monthlySummary: true,
    employee: { select: { employeeId: true } },
} satisfies Prisma.PayrollPayslipSelect;

type PayslipRow = Prisma.PayrollPayslipGetPayload<{ select: typeof payslipSelect }>;

function mapPayslip(row: PayslipRow): PrismaPayslipView {
    return {
        internalId: row.id,
        legacyId: row.legacyFirestoreId,
        employeeId: row.employee.employeeId,
        periodStart: toDateKey(row.periodStart),
        periodEnd: toDateKey(row.periodEnd),
        payFrequency: row.payFrequency,
        monthlyBasicSalary: toDecimalString(row.monthlyBasicSalary),
        cutoffBasicPay: toDecimalString(row.cutoffBasicPay),
        referenceDailyRate: toDecimalString(row.referenceDailyRate),
        basicPay: toDecimalString(row.basicPay),
        grossPay: toDecimalString(row.grossPay),
        deductions: toJsonArray(row.deductions),
        totalDeductions: toDecimalString(row.totalDeductions),
        netPay: toDecimalString(row.netPay),
        status: row.status === "released" ? "released" : "in-progress",
        releasedAt: toIso(row.releasedAt),
        source: row.source,
        payrollReference: row.payrollReference,
        monthlySummary: toJsonObject(row.monthlySummary),
    };
}

function decimal(value: number | string | null | undefined): Prisma.Decimal | null {
    return value === null || value === undefined ? null : new Prisma.Decimal(String(value));
}

export async function listPrismaPayslipsByEmployee(input: {
    employeeId: string;
    page?: number;
    pageSize?: number;
}) {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 50));
    const [rows, total] = await Promise.all([
        getRepositoryPrisma().payrollPayslip.findMany({
            where: { employee: { employeeId: input.employeeId } },
            select: payslipSelect,
            orderBy: [{ periodEnd: "desc" }, { id: "desc" }],
            skip: (page - 1) * pageSize,
            take: pageSize + 1,
        }),
        getRepositoryPrisma().payrollPayslip.count({
            where: { employee: { employeeId: input.employeeId } },
        }),
    ]);
    return {
        rows: rows.slice(0, pageSize).map(mapPayslip),
        total,
        hasNext: rows.length > pageSize,
    };
}

export async function getPrismaPayslipByPeriod(input: {
    employeeId: string;
    periodStart: string;
    periodEnd: string;
}): Promise<PrismaPayslipView | null> {
    const row = await getRepositoryPrisma().payrollPayslip.findFirst({
        where: {
            employee: { employeeId: input.employeeId },
            periodStart: new Date(`${input.periodStart}T00:00:00.000Z`),
            periodEnd: new Date(`${input.periodEnd}T00:00:00.000Z`),
        },
        select: payslipSelect,
    });
    return row ? mapPayslip(row) : null;
}

export async function upsertPrismaPayslipFromResult(input: {
    id: string;
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    payrollReference: string;
    releasedAt: string;
    monthlyBasicSalary?: number | string | null;
    cutoffBasicPay?: number | string | null;
    referenceDailyRate?: number | string | null;
    basicPay?: number | string | null;
    grossPay?: number | string | null;
    deductions?: unknown[];
    totalDeductions?: number | string | null;
    netPay?: number | string | null;
}): Promise<PrismaPayslipView> {
    const prisma = getRepositoryPrisma();
    const employee = await prisma.employee.findUnique({
        where: { employeeId: input.employeeId },
        select: { id: true },
    });
    if (!employee) {
        throw new Error("The employee reference for this payslip was not found.");
    }
    const monthKey = input.periodStart.slice(0, 7);
    const row = await prisma.payrollPayslip.upsert({
        where: {
            employeeId_periodStart_periodEnd: {
                employeeId: employee.id,
                periodStart: new Date(`${input.periodStart}T00:00:00.000Z`),
                periodEnd: new Date(`${input.periodEnd}T00:00:00.000Z`),
            },
        },
        create: {
            employeeId: employee.id,
            periodStart: new Date(`${input.periodStart}T00:00:00.000Z`),
            periodEnd: new Date(`${input.periodEnd}T00:00:00.000Z`),
            payFrequency: "Semi-monthly",
            monthlyBasicSalary: decimal(input.monthlyBasicSalary),
            cutoffBasicPay: decimal(input.cutoffBasicPay),
            referenceDailyRate: decimal(input.referenceDailyRate),
            basicPay: decimal(input.basicPay),
            grossPay: decimal(input.grossPay),
            deductions: toJson(input.deductions ?? []),
            totalDeductions: decimal(input.totalDeductions),
            netPay: decimal(input.netPay),
            status: "released",
            releasedAt: new Date(input.releasedAt),
            source: "PAYROLL_SYSTEM",
            payrollReference: input.payrollReference,
            legacyFirestoreId: input.id,
            monthlySummary: toJson({
                id: `monthly-${input.employeeId}-${monthKey}`,
                monthKey,
                includedPayslipIds: [input.id],
                status: "complete",
                totalEarnings: input.grossPay ?? null,
                totalDeductions: input.totalDeductions ?? null,
                netPay: input.netPay ?? null,
            }),
        },
        update: {
            monthlyBasicSalary: decimal(input.monthlyBasicSalary),
            cutoffBasicPay: decimal(input.cutoffBasicPay),
            referenceDailyRate: decimal(input.referenceDailyRate),
            basicPay: decimal(input.basicPay),
            grossPay: decimal(input.grossPay),
            deductions: toJson(input.deductions ?? []),
            totalDeductions: decimal(input.totalDeductions),
            netPay: decimal(input.netPay),
            status: "released",
            releasedAt: new Date(input.releasedAt),
            payrollReference: input.payrollReference,
            legacyFirestoreId: input.id,
            monthlySummary: toJson({
                id: `monthly-${input.employeeId}-${monthKey}`,
                monthKey,
                includedPayslipIds: [input.id],
                status: "complete",
                totalEarnings: input.grossPay ?? null,
                totalDeductions: input.totalDeductions ?? null,
                netPay: input.netPay ?? null,
            }),
        },
        select: payslipSelect,
    });
    return mapPayslip(row);
}

