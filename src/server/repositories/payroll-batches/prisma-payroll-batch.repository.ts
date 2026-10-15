import "server-only";

import { randomUUID } from "node:crypto";
import type { PayrollBatchStatus as PrismaPayrollBatchStatus, Prisma } from "@prisma/client";

import type {
    PayrollBatchActor,
    PayrollBatchItemSnapshot,
    PayrollBatchPeriod,
} from "@/types/payroll-batches";
import {
    findUserIdByFirebaseUid,
    getRepositoryPrisma,
    isUuid,
    toDateKey,
    toJson,
    toJsonArray,
    toJsonObject,
    toIso,
} from "@/server/repositories/prisma/prisma-repository-helpers";

export class PrismaPayrollBatchNotFoundError extends Error {}
export class PrismaPayrollBatchConflictError extends Error {}
export class PrismaPayrollBatchValidationError extends Error {}

export type PrismaPayrollBatchView = {
    id: string;
    internalId: string;
    period: PayrollBatchPeriod;
    status: PrismaPayrollBatchStatus;
    createdBy: PayrollBatchActor | null;
    createdAt: string;
    updatedAt: string;
    submittedBy: PayrollBatchActor | null;
    submittedAt: string | null;
    recordCount: number;
    blockedCount: number;
    departmentNames: string[];
    includedRecords: PayrollBatchItemSnapshot[];
    notes: string | null;
};

type BatchActorInput = Pick<PayrollBatchActor, "uid" | "username" | "displayName" | "role">;

const batchInclude = {
    items: {
        orderBy: [{ employeeNameSnapshot: "asc" }, { id: "asc" }],
    },
} satisfies Prisma.PayrollBatchInclude;

type BatchRow = Prisma.PayrollBatchGetPayload<{ include: typeof batchInclude }>;

function actor(value: Prisma.JsonValue | null | undefined): PayrollBatchActor | null {
    const snapshot = toJsonObject(value);
    return typeof snapshot.uid === "string"
        && typeof snapshot.username === "string"
        && typeof snapshot.displayName === "string"
        && typeof snapshot.role === "string"
        ? {
            uid: snapshot.uid,
            username: snapshot.username,
            displayName: snapshot.displayName,
            role: snapshot.role,
        }
        : null;
}

function mapItem(item: BatchRow["items"][number]): PayrollBatchItemSnapshot {
    return {
        employeePeriodId: item.employeePeriodId,
        employeeId: item.employeeIdSnapshot,
        employeeName: item.employeeNameSnapshot,
        department: item.departmentSnapshot,
        payrollPeriod: {
            start: toDateKey(item.periodStart),
            end: toDateKey(item.periodEnd),
            label: `${toDateKey(item.periodStart)} to ${toDateKey(item.periodEnd)}`,
        },
        presentDays: item.presentDays,
        lateCount: item.lateCount,
        lateMinutes: item.lateMinutes,
        undertimeMinutes: item.undertimeMinutes,
        hrVerificationStatus: "verified",
        payrollReadiness: "ready",
        sourceAttendanceIds: toJsonArray(item.sourceAttendanceIds).filter(
            (value): value is string => typeof value === "string",
        ),
        snapshotCreatedAt: item.snapshotCreatedAt.toISOString(),
    };
}

function mapBatch(row: BatchRow): PrismaPayrollBatchView {
    const includedRecords = row.items.map(mapItem);
    return {
        id: row.batchReference,
        internalId: row.id,
        period: {
            start: toDateKey(row.periodStart),
            end: toDateKey(row.periodEnd),
            label: row.periodLabel,
        },
        status: row.status,
        createdBy: actor(row.createdBySnapshot),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        submittedBy: actor(row.submittedBySnapshot),
        submittedAt: toIso(row.submittedAt),
        recordCount: row.recordCount,
        blockedCount: row.blockedCount,
        departmentNames: Array.from(new Set(includedRecords.map((item) => item.department))).sort(),
        includedRecords,
        notes: row.notes,
    };
}

function batchWhere(reference: string): Prisma.PayrollBatchWhereUniqueInput {
    return isUuid(reference) ? { id: reference } : { batchReference: reference };
}

export function getPrismaEmployeePeriodId(employeeId: string, periodStart: string): string {
    return `${employeeId}:${periodStart}`;
}

export async function getPrismaPayrollBatchById(
    reference: string,
): Promise<PrismaPayrollBatchView | null> {
    const row = await getRepositoryPrisma().payrollBatch.findUnique({
        where: batchWhere(reference),
        include: batchInclude,
    });

    return row ? mapBatch(row) : null;
}

export async function listPrismaPayrollBatches(input: {
    periodStart?: string;
    status?: PrismaPayrollBatchStatus;
    page?: number;
    pageSize?: number;
} = {}) {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 50));
    const where: Prisma.PayrollBatchWhereInput = {
        ...(input.periodStart ? { periodStart: new Date(`${input.periodStart}T00:00:00.000Z`) } : {}),
        ...(input.status ? { status: input.status } : {}),
    };
    const [rows, total] = await Promise.all([
        getRepositoryPrisma().payrollBatch.findMany({
            where,
            include: batchInclude,
            orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
            skip: (page - 1) * pageSize,
            take: pageSize + 1,
        }),
        getRepositoryPrisma().payrollBatch.count({ where }),
    ]);

    return {
        rows: rows.slice(0, pageSize).map(mapBatch),
        total,
        hasNext: rows.length > pageSize,
    };
}

export async function createPrismaPayrollBatch(input: {
    period: PayrollBatchPeriod;
    actor: BatchActorInput;
    notes?: string | null;
    blockedCount?: number;
    items?: Array<PayrollBatchItemSnapshot & { employeeInternalId: string }>;
}): Promise<PrismaPayrollBatchView> {
    const actorSnapshot = {
        uid: input.actor.uid,
        username: input.actor.username,
        displayName: input.actor.displayName,
        role: input.actor.role,
    };
    const batchReference = `PAY-${input.period.start.replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const createdByUserId = await findUserIdByFirebaseUid(input.actor.uid);
    const prisma = getRepositoryPrisma();
    const row = await prisma.$transaction(async (transaction) => {
        const created = await transaction.payrollBatch.create({
            data: {
                batchReference,
                periodStart: new Date(`${input.period.start}T00:00:00.000Z`),
                periodEnd: new Date(`${input.period.end}T00:00:00.000Z`),
                periodLabel: input.period.label,
                status: "Draft",
                createdByUserId,
                createdBySnapshot: toJson(actorSnapshot),
                recordCount: input.items?.length ?? 0,
                blockedCount: input.blockedCount ?? 0,
                notes: input.notes?.trim() || null,
                ...(input.items?.length
                    ? {
                        items: {
                            create: input.items.map((item) => ({
                                employeeId: item.employeeInternalId,
                                employeePeriodId: item.employeePeriodId,
                                periodStart: new Date(`${item.payrollPeriod.start}T00:00:00.000Z`),
                                periodEnd: new Date(`${item.payrollPeriod.end}T00:00:00.000Z`),
                                employeeIdSnapshot: item.employeeId,
                                employeeNameSnapshot: item.employeeName,
                                departmentSnapshot: item.department,
                                presentDays: item.presentDays,
                                lateCount: item.lateCount,
                                lateMinutes: item.lateMinutes,
                                undertimeMinutes: item.undertimeMinutes,
                                hrVerificationStatus: "verified",
                                payrollReadinessStatus: "ready",
                                sourceAttendanceIds: toJson(item.sourceAttendanceIds),
                                snapshotCreatedAt: new Date(item.snapshotCreatedAt),
                            })),
                        },
                    }
                    : {}),
            },
            include: batchInclude,
        });

        return created;
    });

    return mapBatch(row);
}

export async function addPrismaPayrollBatchItem(input: {
    batchId: string;
    snapshot: PayrollBatchItemSnapshot;
}): Promise<PrismaPayrollBatchView> {
    const prisma = getRepositoryPrisma();
    const row = await prisma.$transaction(async (transaction) => {
        const batch = await transaction.payrollBatch.findUnique({
            where: batchWhere(input.batchId),
            include: batchInclude,
        });
        if (!batch) throw new PrismaPayrollBatchNotFoundError();
        if (batch.status !== "Draft") throw new PrismaPayrollBatchConflictError("Only Draft batches can be changed.");
        if (toDateKey(batch.periodStart) !== input.snapshot.payrollPeriod.start
            || toDateKey(batch.periodEnd) !== input.snapshot.payrollPeriod.end) {
            throw new PrismaPayrollBatchValidationError("The record belongs to a different payroll period.");
        }
        const employee = await transaction.employee.findUnique({
            where: { employeeId: input.snapshot.employeeId },
            select: { id: true },
        });
        if (!employee) throw new PrismaPayrollBatchValidationError("The employee reference was not found.");
        const existing = await transaction.payrollBatchItem.findUnique({
            where: { batchId_employeePeriodId: { batchId: batch.id, employeePeriodId: input.snapshot.employeePeriodId } },
        });
        if (existing) return batch;
        const now = new Date();
        await transaction.payrollBatchItem.create({
            data: {
                batchId: batch.id,
                employeeId: employee.id,
                employeePeriodId: input.snapshot.employeePeriodId,
                periodStart: new Date(`${input.snapshot.payrollPeriod.start}T00:00:00.000Z`),
                periodEnd: new Date(`${input.snapshot.payrollPeriod.end}T00:00:00.000Z`),
                employeeIdSnapshot: input.snapshot.employeeId,
                employeeNameSnapshot: input.snapshot.employeeName,
                departmentSnapshot: input.snapshot.department,
                presentDays: input.snapshot.presentDays,
                lateCount: input.snapshot.lateCount,
                lateMinutes: input.snapshot.lateMinutes,
                undertimeMinutes: input.snapshot.undertimeMinutes,
                hrVerificationStatus: "verified",
                payrollReadinessStatus: "ready",
                sourceAttendanceIds: toJson(input.snapshot.sourceAttendanceIds),
                snapshotCreatedAt: now,
            },
        });
        return transaction.payrollBatch.update({
            where: { id: batch.id },
            data: { recordCount: { increment: 1 } },
            include: batchInclude,
        });
    });

    return mapBatch(row);
}

export async function removePrismaPayrollBatchItem(input: {
    batchId: string;
    employeePeriodId: string;
}): Promise<PrismaPayrollBatchView> {
    const prisma = getRepositoryPrisma();
    const row = await prisma.$transaction(async (transaction) => {
        const batch = await transaction.payrollBatch.findUnique({ where: batchWhere(input.batchId) });
        if (!batch) throw new PrismaPayrollBatchNotFoundError();
        if (batch.status !== "Draft") throw new PrismaPayrollBatchConflictError("Only Draft batches can be changed.");
        const removed = await transaction.payrollBatchItem.deleteMany({
            where: { batchId: batch.id, employeePeriodId: input.employeePeriodId },
        });
        return transaction.payrollBatch.update({
            where: { id: batch.id },
            data: { recordCount: Math.max(0, batch.recordCount - removed.count) },
            include: batchInclude,
        });
    });

    return mapBatch(row);
}

export async function updatePrismaPayrollBatchStatus(input: {
    batchId: string;
    status: "Ready" | "Submitted";
    actor: BatchActorInput;
}): Promise<PrismaPayrollBatchView> {
    const prisma = getRepositoryPrisma();
    const submittedByUserId = await findUserIdByFirebaseUid(input.actor.uid);
    const row = await prisma.$transaction(async (transaction) => {
        const batch = await transaction.payrollBatch.findUnique({ where: batchWhere(input.batchId) });
        if (!batch) throw new PrismaPayrollBatchNotFoundError();
        const expected = input.status === "Ready" ? "Draft" : "Ready";
        if (batch.status !== expected) throw new PrismaPayrollBatchConflictError(`Only ${expected} batches can be updated.`);
        if (batch.recordCount < 1) throw new PrismaPayrollBatchValidationError("The batch must contain at least one record.");
        return transaction.payrollBatch.update({
            where: { id: batch.id },
            data: {
                status: input.status,
                ...(input.status === "Submitted"
                    ? {
                        submittedByUserId,
                        submittedBySnapshot: toJson(input.actor),
                        submittedAt: new Date(),
                    }
                    : {}),
            },
            include: batchInclude,
        });
    });

    return mapBatch(row);
}

export async function markPrismaPayrollBatchSubmittedFromHandoff(input: {
    batchId: string;
    actor: BatchActorInput;
}): Promise<PrismaPayrollBatchView> {
    const prisma = getRepositoryPrisma();
    const submittedByUserId = await findUserIdByFirebaseUid(input.actor.uid);
    const row = await prisma.$transaction(async (transaction) => {
        const batch = await transaction.payrollBatch.findUnique({ where: batchWhere(input.batchId) });
        if (!batch) throw new PrismaPayrollBatchNotFoundError();
        if (batch.status === "Submitted" || batch.status === "Acknowledged") {
            return transaction.payrollBatch.findUniqueOrThrow({ where: { id: batch.id }, include: batchInclude });
        }
        if (batch.status !== "Ready") throw new PrismaPayrollBatchConflictError("Only Ready batches can be submitted.");
        if (batch.recordCount < 1 || batch.blockedCount > 0) throw new PrismaPayrollBatchValidationError("Only complete Ready batches can be submitted.");
        return transaction.payrollBatch.update({
            where: { id: batch.id },
            data: {
                status: "Submitted",
                submittedByUserId,
                submittedBySnapshot: toJson(input.actor),
                submittedAt: new Date(),
            },
            include: batchInclude,
        });
    });

    return mapBatch(row);
}

