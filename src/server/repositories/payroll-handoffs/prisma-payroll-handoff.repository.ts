import "server-only";

import { randomUUID } from "node:crypto";
import type { PayrollAcknowledgementStatus, PayrollTransferStatus, Prisma } from "@prisma/client";

import type {
    PayrollBatchItemSnapshot,
    PayrollBatchPeriod,
} from "@/types/payroll-batches";
import type {
    PayrollHandoffActor,
    PayrollHandoffBatchSummary,
    PayrollHandoffTimelineEvent,
} from "@/types/payroll-handoff";
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

export class PrismaPayrollHandoffNotFoundError extends Error {}
export class PrismaPayrollHandoffConflictError extends Error {}

export type PrismaPayrollHandoffView = {
    transferId: string;
    internalId: string;
    batchId: string;
    period: PayrollBatchPeriod;
    submittedBy: PayrollHandoffActor;
    submittedAt: string;
    readyAt: string;
    acknowledgedAt: string | null;
    failedAt: string | null;
    transferStatus: PayrollTransferStatus;
    acknowledgementStatus: PayrollAcknowledgementStatus;
    externalReference: string | null;
    provider: string;
    failureCode: string | null;
    failureSummary: string | null;
    attemptCount: number;
    createdAt: string;
    updatedAt: string;
    batchSummary: PayrollHandoffBatchSummary;
    timeline: PayrollHandoffTimelineEvent[];
    batchSnapshot: PayrollBatchItemSnapshot[];
};

type HandoffActorInput = Pick<PayrollHandoffActor, "uid" | "username" | "displayName" | "role">;

const handoffInclude = {
    batch: {
        include: {
            items: {
                orderBy: [{ employeeNameSnapshot: "asc" }, { id: "asc" }],
            },
        },
    },
} satisfies Prisma.PayrollHandoffInclude;

type HandoffRow = Prisma.PayrollHandoffGetPayload<{ include: typeof handoffInclude }>;

function batchReferenceWhere(value: string): Prisma.PayrollBatchWhereUniqueInput {
    return isUuid(value) ? { id: value } : { batchReference: value };
}

function actor(value: Prisma.JsonValue): PayrollHandoffActor {
    const snapshot = toJsonObject(value);
    return {
        uid: typeof snapshot.uid === "string" ? snapshot.uid : "system",
        username: typeof snapshot.username === "string" ? snapshot.username : "system",
        displayName: typeof snapshot.displayName === "string" ? snapshot.displayName : "System",
        role: typeof snapshot.role === "string" ? snapshot.role : "system",
    };
}

function batchSummary(value: Prisma.JsonValue): PayrollHandoffBatchSummary {
    const snapshot = toJsonObject(value);
    return {
        employeeCount: typeof snapshot.employeeCount === "number" ? snapshot.employeeCount : 0,
        includedRecordCount: typeof snapshot.includedRecordCount === "number" ? snapshot.includedRecordCount : 0,
        blockedRecordCount: typeof snapshot.blockedRecordCount === "number" ? snapshot.blockedRecordCount : 0,
        departmentCount: typeof snapshot.departmentCount === "number" ? snapshot.departmentCount : 0,
        batchStatus: typeof snapshot.batchStatus === "string" ? snapshot.batchStatus as PayrollHandoffBatchSummary["batchStatus"] : "Ready",
    };
}

function itemSnapshot(item: HandoffRow["batch"]["items"][number]): PayrollBatchItemSnapshot {
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

function timeline(row: HandoffRow): PayrollHandoffTimelineEvent[] {
    const events: PayrollHandoffTimelineEvent[] = [
        { id: "ready", label: "Batch ready for handoff", occurredAt: row.readyAt.toISOString() },
        { id: "submitted", label: "Submitted for handoff", occurredAt: row.submittedAt.toISOString() },
    ];
    if (row.acknowledgedAt) {
        events.push({ id: "acknowledged", label: "Acknowledgement received", occurredAt: row.acknowledgedAt.toISOString() });
    }
    if (row.failedAt) {
        events.push({ id: "failed", label: "Handoff failed", occurredAt: row.failedAt.toISOString() });
    }
    return events.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
}

function mapHandoff(row: HandoffRow): PrismaPayrollHandoffView {
    return {
        transferId: row.transferReference,
        internalId: row.id,
        batchId: row.batch.batchReference,
        period: {
            start: toDateKey(row.periodStart),
            end: toDateKey(row.periodEnd),
            label: row.periodLabel,
        },
        submittedBy: actor(row.submittedBySnapshot),
        submittedAt: row.submittedAt.toISOString(),
        readyAt: row.readyAt.toISOString(),
        acknowledgedAt: toIso(row.acknowledgedAt),
        failedAt: toIso(row.failedAt),
        transferStatus: row.transferStatus,
        acknowledgementStatus: row.acknowledgementStatus,
        externalReference: row.externalReference,
        provider: row.provider,
        failureCode: row.failureCode,
        failureSummary: row.failureSummary,
        attemptCount: row.attemptCount,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        batchSummary: batchSummary(row.batchSummarySnapshot),
        timeline: timeline(row),
        batchSnapshot: row.batch.items.map(itemSnapshot),
    };
}

export async function getPrismaPayrollHandoffByBatchId(
    batchId: string,
): Promise<PrismaPayrollHandoffView | null> {
    const batch = await getRepositoryPrisma().payrollBatch.findUnique({
        where: batchReferenceWhere(batchId),
        select: { id: true },
    });
    if (!batch) return null;
    const row = await getRepositoryPrisma().payrollHandoff.findUnique({
        where: { batchId: batch.id },
        include: handoffInclude,
    });
    return row ? mapHandoff(row) : null;
}

export async function getPrismaPayrollHandoffByTransferId(
    transferId: string,
): Promise<PrismaPayrollHandoffView | null> {
    const row = await getRepositoryPrisma().payrollHandoff.findUnique({
        where: { transferReference: transferId },
        include: handoffInclude,
    });
    return row ? mapHandoff(row) : null;
}

export async function listPrismaPayrollHandoffs(input: {
    status?: PayrollTransferStatus;
    page?: number;
    pageSize?: number;
} = {}) {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 50));
    const where: Prisma.PayrollHandoffWhereInput = input.status
        ? { transferStatus: input.status }
        : {};
    const [rows, total] = await Promise.all([
        getRepositoryPrisma().payrollHandoff.findMany({
            where,
            include: handoffInclude,
            orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
            skip: (page - 1) * pageSize,
            take: pageSize + 1,
        }),
        getRepositoryPrisma().payrollHandoff.count({ where }),
    ]);
    return { rows: rows.slice(0, pageSize).map(mapHandoff), total, hasNext: rows.length > pageSize };
}

export async function claimPrismaPayrollHandoff(input: {
    batchId: string;
    period: PayrollBatchPeriod;
    readyAt: string;
    actor: HandoffActorInput;
    batchSummary: PayrollHandoffBatchSummary;
}): Promise<PrismaPayrollHandoffView> {
    const prisma = getRepositoryPrisma();
    const submittedByUserId = await findUserIdByFirebaseUid(input.actor.uid);
    const row = await prisma.$transaction(async (transaction) => {
        const batch = await transaction.payrollBatch.findUnique({
            where: batchReferenceWhere(input.batchId),
            include: { items: true },
        });
        if (!batch) throw new PrismaPayrollHandoffNotFoundError();
        const existing = await transaction.payrollHandoff.findUnique({ where: { batchId: batch.id } });
        const now = new Date();
        if (existing) {
            if (existing.transferStatus !== "failed") {
                throw new PrismaPayrollHandoffConflictError("This batch already has a payroll handoff in progress or completed.");
            }
            if (existing.attemptCount >= 3) {
                throw new PrismaPayrollHandoffConflictError("This handoff has reached its retry limit.");
            }
            return transaction.payrollHandoff.update({
                where: { id: existing.id },
                data: {
                    transferStatus: "submitting",
                    acknowledgementStatus: "pending",
                    submittedByUserId,
                    submittedBySnapshot: toJson(input.actor),
                    submittedAt: now,
                    acknowledgedAt: null,
                    failedAt: null,
                    externalReference: null,
                    failureCode: null,
                    failureSummary: null,
                    attemptCount: { increment: 1 },
                },
                include: handoffInclude,
            });
        }
        return transaction.payrollHandoff.create({
            data: {
                batchId: batch.id,
                transferReference: `TRF-${batch.batchReference}-${randomUUID().slice(0, 8).toUpperCase()}`,
                periodStart: new Date(`${input.period.start}T00:00:00.000Z`),
                periodEnd: new Date(`${input.period.end}T00:00:00.000Z`),
                periodLabel: input.period.label,
                submittedByUserId,
                submittedBySnapshot: toJson(input.actor),
                readyAt: new Date(input.readyAt),
                submittedAt: now,
                transferStatus: "submitting",
                acknowledgementStatus: "pending",
                provider: "simulated-payroll-adapter",
                batchSummarySnapshot: toJson(input.batchSummary),
            },
            include: handoffInclude,
        });
    });
    return mapHandoff(row);
}

export async function updatePrismaPayrollHandoffResult(input: {
    batchId: string;
    transferStatus: "submitted" | "failed";
    acknowledgementStatus: PayrollAcknowledgementStatus;
    provider: string;
    externalReference?: string | null;
    failureCode?: string | null;
    failureSummary?: string | null;
}): Promise<PrismaPayrollHandoffView> {
    const batch = await getRepositoryPrisma().payrollBatch.findUnique({
        where: batchReferenceWhere(input.batchId),
        select: { id: true },
    });
    if (!batch) throw new PrismaPayrollHandoffNotFoundError();
    const row = await getRepositoryPrisma().$transaction(async (transaction) => {
        const existing = await transaction.payrollHandoff.findUnique({ where: { batchId: batch.id } });
        if (!existing) throw new PrismaPayrollHandoffNotFoundError();
        if (existing.transferStatus !== "submitting") throw new PrismaPayrollHandoffConflictError("This handoff is no longer awaiting a response.");
        const acknowledged = input.acknowledgementStatus === "accepted" || input.acknowledgementStatus === "rejected";
        return transaction.payrollHandoff.update({
            where: { id: existing.id },
            data: {
                transferStatus: input.transferStatus,
                acknowledgementStatus: input.acknowledgementStatus,
                provider: input.provider,
                externalReference: input.externalReference ?? null,
                failureCode: input.failureCode ?? null,
                failureSummary: input.failureSummary ?? null,
                acknowledgedAt: acknowledged ? new Date() : null,
                failedAt: input.transferStatus === "failed" ? new Date() : null,
            },
            include: handoffInclude,
        });
    });
    return mapHandoff(row);
}

