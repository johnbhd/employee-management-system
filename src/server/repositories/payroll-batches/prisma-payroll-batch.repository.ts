import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma, type PayrollBatchStatus as PrismaPayrollBatchStatus } from "@prisma/client";

import type {
    PayrollBatchAttendanceSnapshot,
    PayrollBatchActor,
    PayrollBatchItemSnapshot,
    PayrollBatchPeriod,
    PayrollBatchReadiness,
    PayrollBatchVerificationSnapshot,
} from "@/types/payroll-batches";
import {
    evaluatePayrollBatchReadiness,
    type PayrollBatchReadinessAttendanceRecord,
} from "@/server/payroll/payroll-batch-readiness";
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
export class PrismaPayrollBatchReadinessError extends Error {
    constructor(readonly readiness: PayrollBatchReadiness) {
        super("The Payroll batch is not ready to freeze.");
    }
}

export type PrismaPayrollBatchView = {
    id: string;
    internalId: string;
    period: PayrollBatchPeriod;
    status: PrismaPayrollBatchStatus;
    createdBy: PayrollBatchActor | null;
    createdAt: string;
    updatedAt: string;
    frozenBy: PayrollBatchActor | null;
    frozenAt: string | null;
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

function stringOrNull(value: unknown): string | null {
    return typeof value === "string" ? value : null;
}

export function parseAttendanceSnapshot(
    value: Prisma.JsonValue | null,
): PayrollBatchAttendanceSnapshot[] | null {
    if (!Array.isArray(value)) return null;

    const records = value.flatMap((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
        const record = entry as Record<string, unknown>;
        const attendanceRecordId = stringOrNull(record.attendanceRecordId);
        const attendanceDate = stringOrNull(record.attendanceDate);
        if (!attendanceRecordId || !attendanceDate) return [];
        return [{
            attendanceRecordId,
            attendanceDate,
            effectiveTimeIn: stringOrNull(record.effectiveTimeIn),
            effectiveTimeOut: stringOrNull(record.effectiveTimeOut),
            attendanceStatus: stringOrNull(record.attendanceStatus) ?? "unknown",
            timeInSource: stringOrNull(record.timeInSource),
            timeOutSource: stringOrNull(record.timeOutSource),
            technicalState: stringOrNull(record.technicalState),
            businessStatus: stringOrNull(record.businessStatus),
        } satisfies PayrollBatchAttendanceSnapshot];
    });

    return records.length === value.length ? records : null;
}

export function parseVerificationSnapshot(
    value: Prisma.JsonValue | null,
): PayrollBatchVerificationSnapshot[] | null {
    if (!Array.isArray(value)) return null;

    const records = value.flatMap((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
        const record = entry as Record<string, unknown>;
        const attendanceRecordId = stringOrNull(record.attendanceRecordId);
        if (!attendanceRecordId) return [];
        return [{
            attendanceRecordId,
            verifiedAt: stringOrNull(record.verifiedAt),
            verifiedBy: record.verifiedBy ?? null,
        } satisfies PayrollBatchVerificationSnapshot];
    });

    return records.length === value.length ? records : null;
}

export function parseScheduleSnapshot(
    value: Prisma.JsonValue | null,
): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
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
        attendanceSnapshot: parseAttendanceSnapshot(item.attendanceSnapshot),
        scheduleSnapshot: parseScheduleSnapshot(item.scheduleSnapshot),
        verificationSnapshot: parseVerificationSnapshot(item.verificationSnapshot),
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
        frozenBy: actor(row.frozenBySnapshot),
        frozenAt: toIso(row.frozenAt),
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

type ReadinessAttendanceRow = Prisma.AttendanceRecordGetPayload<{
    select: typeof readinessAttendanceSelect;
}>;

const readinessAttendanceSelect = {
    id: true,
    employeeId: true,
    attendanceDate: true,
    timeIn: true,
    timeOut: true,
    timeInSource: true,
    timeOutSource: true,
    status: true,
    hrVerificationStatus: true,
    hrVerifiedAt: true,
    hrVerifiedBySnapshot: true,
    technicalState: true,
    processedAt: true,
    requiresReview: true,
    businessStatus: true,
    scheduleSnapshot: true,
} satisfies Prisma.AttendanceRecordSelect;

function jsonStringArray(value: Prisma.JsonValue | null): string[] {
    return toJsonArray(value).filter(
        (entry): entry is string => typeof entry === "string" && entry.length > 0,
    );
}

function toReadinessAttendanceRecord(
    row: ReadinessAttendanceRow,
): PayrollBatchReadinessAttendanceRecord {
    return {
        id: row.id,
        employeeId: row.employeeId,
        attendanceDate: toDateKey(row.attendanceDate),
        timeIn: toIso(row.timeIn),
        timeOut: toIso(row.timeOut),
        timeInSource: row.timeInSource,
        timeOutSource: row.timeOutSource,
        attendanceStatus: row.status,
        hrVerificationStatus: row.hrVerificationStatus,
        hrVerifiedAt: toIso(row.hrVerifiedAt),
        hrVerifiedBySnapshot: row.hrVerifiedBySnapshot,
        technicalState: row.technicalState,
        processedAt: toIso(row.processedAt),
        requiresReview: row.requiresReview,
        businessStatus: row.businessStatus,
        scheduleSnapshot: row.scheduleSnapshot,
    };
}

async function loadPayrollBatchReadiness(
    transaction: Prisma.TransactionClient,
    reference: string,
) {
    const batch = await transaction.payrollBatch.findUnique({
        where: batchWhere(reference),
        include: batchInclude,
    });

    if (!batch) throw new PrismaPayrollBatchNotFoundError();

    const sourceAttendanceIds = Array.from(new Set(
        batch.items.flatMap((item) => jsonStringArray(item.sourceAttendanceIds)),
    ));
    const employeeIds = Array.from(new Set(batch.items.map((item) => item.employeeId)));
    const [attendanceRows, pendingCorrections, employees, owners] = await Promise.all([
        sourceAttendanceIds.length > 0
            ? transaction.attendanceRecord.findMany({
                where: { id: { in: sourceAttendanceIds } },
                select: readinessAttendanceSelect,
            })
            : Promise.resolve([] as ReadinessAttendanceRow[]),
        sourceAttendanceIds.length > 0
            ? transaction.attendanceCorrection.findMany({
                where: {
                    attendanceRecordId: { in: sourceAttendanceIds },
                    status: "pending",
                },
                select: { attendanceRecordId: true },
            })
            : Promise.resolve([] as Array<{ attendanceRecordId: string }>),
        employeeIds.length > 0
            ? transaction.employee.findMany({
                where: { id: { in: employeeIds } },
                select: { id: true },
            })
            : Promise.resolve([] as Array<{ id: string }>),
        employeeIds.length > 0
            ? transaction.payrollBatchItem.findMany({
                where: {
                    employeeId: { in: employeeIds },
                    periodStart: batch.periodStart,
                    NOT: { batchId: batch.id },
                },
                select: {
                    employeeId: true,
                    batch: { select: { batchReference: true } },
                },
            })
            : Promise.resolve([] as Array<{ employeeId: string; batch: { batchReference: string } }>),
    ]);

    const attendanceById = new Map(
        attendanceRows.map((row) => [row.id, toReadinessAttendanceRecord(row)]),
    );
    const pendingCorrectionIds = new Set(
        pendingCorrections.map((correction) => correction.attendanceRecordId),
    );
    const employeeIdsInDatabase = new Set(employees.map((employee) => employee.id));
    const ownerByEmployeeId = new Map(
        owners.map((owner) => [owner.employeeId, owner.batch.batchReference]),
    );

    const readiness = evaluatePayrollBatchReadiness({
        batchId: batch.batchReference,
        status: batch.status,
        periodStart: toDateKey(batch.periodStart),
        periodEnd: toDateKey(batch.periodEnd),
        items: batch.items.map((item) => ({
            id: item.id,
            employeeId: item.employeeId,
            employeeIdSnapshot: item.employeeIdSnapshot,
            employeeNameSnapshot: item.employeeNameSnapshot,
            employeePeriodId: item.employeePeriodId,
            sourceAttendanceIds: jsonStringArray(item.sourceAttendanceIds),
            employeeExists: employeeIdsInDatabase.has(item.employeeId),
            periodStart: toDateKey(batch.periodStart),
            periodEnd: toDateKey(batch.periodEnd),
            sourceRecords: jsonStringArray(item.sourceAttendanceIds)
                .map((id) => attendanceById.get(id))
                .filter((record): record is PayrollBatchReadinessAttendanceRecord => Boolean(record)),
            pendingCorrectionIds,
            existingBatchReference: ownerByEmployeeId.get(item.employeeId) ?? null,
        })),
    });

    return { batch, readiness };
}

function publicReadiness(
    readiness: ReturnType<typeof evaluatePayrollBatchReadiness>,
): PayrollBatchReadiness {
    return {
        batchId: readiness.batchId,
        status: readiness.status,
        ready: readiness.ready,
        totalItems: readiness.totalItems,
        eligibleItems: readiness.eligibleItems,
        blockedItems: readiness.blockedItems,
        reasons: readiness.reasons,
        items: readiness.items,
    };
}

export async function getPrismaPayrollBatchReadiness(
    reference: string,
): Promise<PayrollBatchReadiness> {
    const result = await getRepositoryPrisma().$transaction((transaction) => (
        loadPayrollBatchReadiness(transaction, reference)
    ));
    return publicReadiness(result.readiness);
}

export async function freezePrismaPayrollBatch(input: {
    batchId: string;
    actor: BatchActorInput;
}): Promise<PrismaPayrollBatchView> {
    const prisma = getRepositoryPrisma();
    const row = await prisma.$transaction(async (transaction) => {
        const existing = await transaction.payrollBatch.findUnique({
            where: batchWhere(input.batchId),
            select: { status: true },
        });

        if (!existing) throw new PrismaPayrollBatchNotFoundError();
        if (existing.status === "Ready") {
            throw new PrismaPayrollBatchConflictError("This Payroll batch is already Ready and frozen.");
        }
        if (existing.status !== "Draft") {
            throw new PrismaPayrollBatchConflictError("Only Draft Payroll batches can be frozen.");
        }

        const result = await loadPayrollBatchReadiness(transaction, input.batchId);
        if (!result.readiness.ready) {
            throw new PrismaPayrollBatchReadinessError(publicReadiness(result.readiness));
        }

        const frozenAt = new Date();
        const frozenByUser = await transaction.user.findUnique({
            where: { firebaseUid: input.actor.uid },
            select: { id: true },
        });

        for (const item of result.readiness.evaluatedItems) {
            await transaction.payrollBatchItem.update({
                where: { id: item.itemId },
                data: {
                    hrVerificationStatus: "verified",
                    payrollReadinessStatus: "ready",
                    attendanceSnapshot: toJson(item.snapshot.attendanceSnapshot),
                    scheduleSnapshot: item.snapshot.scheduleSnapshot
                        ? toJson(item.snapshot.scheduleSnapshot)
                        : Prisma.JsonNull,
                    verificationSnapshot: toJson(item.snapshot.verificationSnapshot),
                    snapshotCreatedAt: frozenAt,
                },
            });
        }

        return transaction.payrollBatch.update({
            where: { id: result.batch.id },
            data: {
                status: "Ready",
                recordCount: result.readiness.totalItems,
                blockedCount: 0,
                frozenByUserId: frozenByUser?.id ?? null,
                frozenBySnapshot: toJson(input.actor),
                frozenAt,
            },
            include: batchInclude,
        });
    });

    return mapBatch(row);
}

export async function createPrismaPayrollBatch(input: {
    period: PayrollBatchPeriod;
    actor: BatchActorInput;
    notes?: string | null;
    blockedCount?: number;
    items?: Array<PayrollBatchItemSnapshot & { employeeInternalId: string }>;
}, transaction?: Prisma.TransactionClient): Promise<PrismaPayrollBatchView> {
    const actorSnapshot = {
        uid: input.actor.uid,
        username: input.actor.username,
        displayName: input.actor.displayName,
        role: input.actor.role,
    };
    const batchReference = `PAY-${input.period.start.replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const create = async (transaction: Prisma.TransactionClient) => {
        const createdByUserId = await findUserIdByFirebaseUid(input.actor.uid, transaction);

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
    };

    const row = transaction
        ? await create(transaction)
        : await getRepositoryPrisma().$transaction(create);

    return mapBatch(row);
}

export async function addPrismaPayrollBatchItem(input: {
    batchId: string;
    snapshot: PayrollBatchItemSnapshot;
}, transaction?: Prisma.TransactionClient): Promise<PrismaPayrollBatchView> {
    const add = async (transaction: Prisma.TransactionClient) => {
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
        if (input.snapshot.employeePeriodId !== getPrismaEmployeePeriodId(
            input.snapshot.employeeId,
            input.snapshot.payrollPeriod.start,
        )) {
            throw new PrismaPayrollBatchValidationError("The employee-period identifier does not match the snapshot.");
        }
        const employee = await transaction.employee.findUnique({
            where: { employeeId: input.snapshot.employeeId },
            select: { id: true },
        });
        if (!employee) throw new PrismaPayrollBatchValidationError("The employee reference was not found.");
        const periodStart = new Date(`${input.snapshot.payrollPeriod.start}T00:00:00.000Z`);
        const existingOwner = await transaction.payrollBatchItem.findUnique({
            where: {
                employeeId_periodStart: {
                    employeeId: employee.id,
                    periodStart,
                },
            },
            select: { batchId: true },
        });
        if (existingOwner && existingOwner.batchId !== batch.id) {
            throw new PrismaPayrollBatchConflictError("This employee-period record is already included in another payroll batch.");
        }
        const sourceAttendanceIds = Array.from(new Set(input.snapshot.sourceAttendanceIds));
        if (sourceAttendanceIds.length === 0) {
            throw new PrismaPayrollBatchValidationError("The batch item has no attendance source records.");
        }
        const attendanceRecords = await transaction.attendanceRecord.findMany({
            where: {
                id: { in: sourceAttendanceIds },
                employeeId: employee.id,
            },
            select: {
                id: true,
                timeIn: true,
                timeOut: true,
                hrVerificationStatus: true,
                hrVerifiedAt: true,
                technicalState: true,
                processedAt: true,
                requiresReview: true,
            },
        });
        const pendingCorrections = await transaction.attendanceCorrection.count({
            where: {
                attendanceRecordId: { in: sourceAttendanceIds },
                status: "pending",
            },
        });
        const sourceIdsAreCurrent = attendanceRecords.length === sourceAttendanceIds.length;
        const allSourcesEligible = sourceIdsAreCurrent
            && pendingCorrections === 0
            && attendanceRecords.every((record) => (
                record.timeIn !== null
                && record.timeOut !== null
                && record.hrVerificationStatus === "verified"
                && record.hrVerifiedAt !== null
                && record.technicalState === "COMPLETE"
                && record.processedAt !== null
                && !record.requiresReview
            ));
        if (!allSourcesEligible) {
            throw new PrismaPayrollBatchConflictError("Payroll eligibility changed. Refresh verified attendance before adding this record.");
        }
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
                periodStart,
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
    };

    const row = transaction
        ? await add(transaction)
        : await getRepositoryPrisma().$transaction(add);

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
    if (input.status === "Ready") {
        return freezePrismaPayrollBatch(input);
    }

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

