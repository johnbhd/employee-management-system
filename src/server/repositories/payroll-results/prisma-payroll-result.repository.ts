import "server-only";

import type { PayrollExternalResultStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import type { PayrollBatchPeriod } from "@/types/payroll-batches";
import type {
    PayrollResultItem,
    PayrollResultRecord,
} from "@/types/payroll-results";
import {
    getRepositoryPrisma,
    isUuid,
    toDateKey,
    toIso,
} from "@/server/repositories/prisma/prisma-repository-helpers";
import { recordPrismaAuditEvent } from "@/server/repositories/audit/prisma-audit.repository";

export class PrismaPayrollResultDataError extends Error {}
export class PrismaPayrollResultConflictError extends Error {}

const resultInclude = {
    batch: {
        select: {
            batchReference: true,
            periodStart: true,
            periodEnd: true,
            periodLabel: true,
        },
    },
    handoff: { select: { transferReference: true } },
    items: { orderBy: [{ employeeNameSnapshot: "asc" }, { id: "asc" }] },
} satisfies Prisma.PayrollResultInclude;

type ResultRow = Prisma.PayrollResultGetPayload<{ include: typeof resultInclude }>;

function batchWhere(reference: string): Prisma.PayrollBatchWhereUniqueInput {
    return isUuid(reference) ? { id: reference } : { batchReference: reference };
}

function mapPeriod(row: {
    periodStart: Date;
    periodEnd: Date;
    periodLabel?: string;
}): PayrollBatchPeriod {
    const start = toDateKey(row.periodStart);
    const end = toDateKey(row.periodEnd);
    return {
        start,
        end,
        label: row.periodLabel ?? `${start} to ${end}`,
    };
}

function mapResult(row: ResultRow): PayrollResultRecord {
    return {
        resultId: row.resultReference,
        batchId: row.batch.batchReference,
        transferId: row.handoff.transferReference,
        period: mapPeriod(row.batch),
        externalPayrollReference: row.externalPayrollReference,
        status: row.status,
        provider: row.provider,
        employeeCount: row.employeeCount,
        processedCount: row.processedCount,
        pendingCount: row.pendingCount,
        rejectedCount: row.rejectedCount,
        failedCount: row.failedCount,
        payslipAvailableCount: row.payslipAvailableCount,
        receivedAt: row.receivedAt.toISOString(),
        processedAt: toIso(row.processedAt),
        completedAt: toIso(row.completedAt),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

function mapItem(row: ResultRow["items"][number], result: ResultRow): PayrollResultItem {
    return {
        id: row.id,
        resultId: result.resultReference,
        batchId: result.batch.batchReference,
        transferId: result.handoff.transferReference,
        employeeId: row.employeeIdSnapshot,
        employeeName: row.employeeNameSnapshot,
        department: row.departmentSnapshot,
        period: mapPeriod(row),
        externalEmployeeReference: row.externalEmployeeReference,
        externalPayrollReference: row.externalPayrollReference,
        processingStatus: row.processingStatus,
        payslipStatus: row.payslipStatus,
        payslipId: row.externalPayslipId,
        releasedAt: toIso(row.releasedAt),
        processedAt: toIso(row.processedAt),
        issueCode: row.issueCode,
        issueSummary: row.issueSummary,
    };
}

export async function listPrismaPayrollResults(input: {
    status?: PayrollExternalResultStatus;
    page?: number;
    pageSize?: number;
} = {}) {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 50));
    const where: Prisma.PayrollResultWhereInput = input.status ? { status: input.status } : {};
    const [rows, total] = await Promise.all([
        getRepositoryPrisma().payrollResult.findMany({
            where,
            include: resultInclude,
            orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
            skip: (page - 1) * pageSize,
            take: pageSize + 1,
        }),
        getRepositoryPrisma().payrollResult.count({ where }),
    ]);
    return {
        rows: rows.slice(0, pageSize).map(mapResult),
        total,
        hasNext: rows.length > pageSize,
    };
}

export async function getPrismaPayrollResultById(
    resultId: string,
): Promise<PayrollResultRecord | null> {
    const row = await getRepositoryPrisma().payrollResult.findUnique({
        where: { resultReference: resultId },
        include: resultInclude,
    });
    return row ? mapResult(row) : null;
}

export async function getPrismaPayrollResultByTransferId(
    transferId: string,
): Promise<PayrollResultRecord | null> {
    const row = await getRepositoryPrisma().payrollResult.findFirst({
        where: { handoff: { transferReference: transferId } },
        include: resultInclude,
    });
    return row ? mapResult(row) : null;
}

export async function listPrismaPayrollResultItems(
    resultId: string,
): Promise<PayrollResultItem[]> {
    const row = await getRepositoryPrisma().payrollResult.findUnique({
        where: { resultReference: resultId },
        include: resultInclude,
    });
    return row ? row.items.map((item) => mapItem(item, row)) : [];
}

export async function getPrismaPayrollResultDetail(resultId: string) {
    const row = await getRepositoryPrisma().payrollResult.findUnique({
        where: { resultReference: resultId },
        include: resultInclude,
    });
    return row ? { result: mapResult(row), items: row.items.map((item) => mapItem(item, row)) } : null;
}

export async function upsertPrismaPayrollResult(input: {
    result: PayrollResultRecord;
    items: PayrollResultItem[];
}): Promise<void> {
    const prisma = getRepositoryPrisma();
    await prisma.$transaction(async (transaction) => {
        const batch = await transaction.payrollBatch.findUnique({ where: batchWhere(input.result.batchId) });
        const handoff = await transaction.payrollHandoff.findUnique({
            where: { transferReference: input.result.transferId },
        });
        if (!batch || !handoff || handoff.batchId !== batch.id) {
            throw new PrismaPayrollResultDataError("The Payroll Result references an unknown batch or handoff.");
        }
        const existing = await transaction.payrollResult.findUnique({
            where: { resultReference: input.result.resultId },
        });
        if (existing && (existing.batchId !== batch.id || existing.handoffId !== handoff.id)) {
            throw new PrismaPayrollResultConflictError("A different Payroll Result already uses this reference.");
        }
        const result = existing
            ? await transaction.payrollResult.update({
                where: { id: existing.id },
                data: {
                    externalPayrollReference: input.result.externalPayrollReference,
                    status: input.result.status,
                    provider: input.result.provider,
                    employeeCount: input.result.employeeCount,
                    processedCount: input.result.processedCount,
                    pendingCount: input.result.pendingCount,
                    rejectedCount: input.result.rejectedCount,
                    failedCount: input.result.failedCount,
                    payslipAvailableCount: input.result.payslipAvailableCount,
                    receivedAt: new Date(input.result.receivedAt),
                    processedAt: input.result.processedAt ? new Date(input.result.processedAt) : null,
                    completedAt: input.result.completedAt ? new Date(input.result.completedAt) : null,
                },
            })
            : await transaction.payrollResult.create({
                data: {
                    batchId: batch.id,
                    handoffId: handoff.id,
                    resultReference: input.result.resultId,
                    externalPayrollReference: input.result.externalPayrollReference,
                    status: input.result.status,
                    provider: input.result.provider,
                    employeeCount: input.result.employeeCount,
                    processedCount: input.result.processedCount,
                    pendingCount: input.result.pendingCount,
                    rejectedCount: input.result.rejectedCount,
                    failedCount: input.result.failedCount,
                    payslipAvailableCount: input.result.payslipAvailableCount,
                    receivedAt: new Date(input.result.receivedAt),
                    processedAt: input.result.processedAt ? new Date(input.result.processedAt) : null,
                    completedAt: input.result.completedAt ? new Date(input.result.completedAt) : null,
                },
            });

        for (const item of input.items) {
            const employee = await transaction.employee.findUnique({
                where: { employeeId: item.employeeId },
                select: { id: true },
            });
            await transaction.payrollResultItem.upsert({
                where: {
                    resultId_employeeIdSnapshot: {
                        resultId: result.id,
                        employeeIdSnapshot: item.employeeId,
                    },
                },
                create: {
                    resultId: result.id,
                    employeeId: employee?.id ?? null,
                    employeeIdSnapshot: item.employeeId,
                    employeeNameSnapshot: item.employeeName,
                    departmentSnapshot: item.department,
                    periodStart: new Date(`${item.period.start}T00:00:00.000Z`),
                    periodEnd: new Date(`${item.period.end}T00:00:00.000Z`),
                    externalEmployeeReference: item.externalEmployeeReference,
                    externalPayrollReference: item.externalPayrollReference,
                    processingStatus: item.processingStatus,
                    payslipStatus: item.payslipStatus,
                    externalPayslipId: item.payslipId,
                    issueCode: item.issueCode,
                    issueSummary: item.issueSummary,
                    processedAt: item.processedAt ? new Date(item.processedAt) : null,
                    releasedAt: item.releasedAt ? new Date(item.releasedAt) : null,
                },
                update: {
                    employeeId: employee?.id ?? null,
                    employeeNameSnapshot: item.employeeName,
                    departmentSnapshot: item.department,
                    externalPayrollReference: item.externalPayrollReference,
                    processingStatus: item.processingStatus,
                    payslipStatus: item.payslipStatus,
                    externalPayslipId: item.payslipId,
                    issueCode: item.issueCode,
                    issueSummary: item.issueSummary,
                    processedAt: item.processedAt ? new Date(item.processedAt) : null,
                    releasedAt: item.releasedAt ? new Date(item.releasedAt) : null,
                },
            });
        }
    });
}

export async function writePrismaPayrollResultAuditEvents(input: {
    result: PayrollResultRecord;
    items: PayrollResultItem[];
    receivedAt: string;
}) {
    const events = [
        {
            eventType: "payroll.result.received",
            action: "Payroll result received",
            summary: "A Payroll result was received from the external Payroll system.",
        },
        ...(input.result.status === "completed" || input.result.status === "completed_with_issues"
            ? [{
                eventType: "payroll.result.completed",
                action: "Payroll result completed",
                summary: "A Payroll result completed processing.",
            }]
            : []),
    ];
    await Promise.all(events.map((event) => recordPrismaAuditEvent({
        eventType: event.eventType,
        action: event.action,
        module: "Payroll Integration",
        actor: { type: "integration", uid: "payroll-integration", displayName: "Payroll Integration", role: "system" },
        target: { type: "payroll_result", id: input.result.resultId, reference: input.result.externalPayrollReference, label: input.result.resultId },
        outcome: "Successful",
        summary: event.summary,
        metadata: { resultId: input.result.resultId, batchId: input.result.batchId },
        occurredAt: new Date(input.receivedAt),
    })));
}

