import "server-only";

import {
    Prisma,
    type AttendanceSource,
    type AttendanceStatus,
    type UnifiedAttendanceBusinessStatus,
    type UnifiedAttendanceTechnicalState,
} from "@prisma/client";
import {
    getRepositoryPrisma,
    toActorSnapshot,
    toDateKey,
    toIso,
    toJson,
    toTimeKey,
    toUtcDate,
} from "@/server/repositories/prisma/prisma-repository-helpers";
import type {
    UnifiedAttendanceBusinessStatus as UnifiedAttendanceBusinessStatusValue,
    UnifiedAttendanceListFilters,
    UnifiedAttendanceTechnicalState as UnifiedAttendanceTechnicalStateValue,
} from "@/types/unified-attendance";

const scheduleSelect = {
    id: true,
    scheduleId: true,
    workStart: true,
    workEnd: true,
    breakStart: true,
    breakEnd: true,
    shiftLabel: true,
    workDays: true,
    restDays: true,
    workLocation: true,
    effectiveFrom: true,
    effectiveTo: true,
} satisfies Prisma.EmployeeScheduleSelect;

const unifiedAttendanceSelect = {
    id: true,
    attendanceDate: true,
    timeIn: true,
    timeOut: true,
    timeInSource: true,
    timeOutSource: true,
    timeInSourceReference: true,
    timeOutSourceReference: true,
    technicalState: true,
    businessStatus: true,
    processedAt: true,
    processingVersion: true,
    lastReprocessedAt: true,
    requiresReview: true,
    reviewReasonCode: true,
    scheduleSnapshot: true,
    createdAt: true,
    updatedAt: true,
    employee: {
        select: {
            id: true,
            employeeId: true,
            displayName: true,
            department: true,
        },
    },
    schedule: {
        select: scheduleSelect,
    },
    bundyEvidence: {
        select: {
            id: true,
            bundyRawEvent: {
                select: {
                    id: true,
                    sourceLogId: true,
                    importId: true,
                    event: true,
                    occurredAt: true,
                },
            },
        },
    },
} satisfies Prisma.AttendanceRecordSelect;

type UnifiedAttendanceRow = Prisma.AttendanceRecordGetPayload<{
    select: typeof unifiedAttendanceSelect;
}>;

export type UnifiedAttendanceEvidence = {
    id: string;
    rawEventId: string;
    sourceLogId: string;
    importId: string;
    event: "IN" | "OUT";
    occurredAt: string;
};

export type UnifiedAttendanceView = {
    id: string;
    employee: {
        internalId: string;
        employeeId: string;
        displayName: string;
        department: string;
    };
    attendanceDate: string;
    firstInAt: string | null;
    lastOutAt: string | null;
    firstInSource: AttendanceSource | null;
    lastOutSource: AttendanceSource | null;
    firstInSourceReference: string | null;
    lastOutSourceReference: string | null;
    technicalState: UnifiedAttendanceTechnicalState;
    businessStatus: UnifiedAttendanceBusinessStatus;
    schedule: {
        internalId: string;
        scheduleId: string;
        workStart: string | null;
        workEnd: string | null;
        breakStart: string | null;
        breakEnd: string | null;
        shiftLabel: string | null;
        workDays: string[];
        restDays: string[];
        workLocation: string | null;
        effectiveFrom: string | null;
        effectiveTo: string | null;
    } | null;
    scheduleSnapshot: Prisma.JsonValue | null;
    requiresReview: boolean;
    reviewReasonCode: string | null;
    processedAt: string | null;
    processingVersion: string | null;
    lastReprocessedAt: string | null;
    bundyEvidence: UnifiedAttendanceEvidence[];
    createdAt: string;
    updatedAt: string;
};

export type UnifiedAttendanceUpsertInput = {
    employeeId: string;
    attendanceDate: string;
    employeeScheduleId?: string | null;
    scheduleSnapshot?: Prisma.InputJsonValue | null;
    timeIn: Date | null;
    timeOut?: Date | null;
    timeInSource: AttendanceSource | null;
    timeOutSource?: AttendanceSource | null;
    timeInSourceReference?: string | null;
    timeOutSourceReference?: string | null;
    technicalState: UnifiedAttendanceTechnicalStateValue;
    businessStatus?: UnifiedAttendanceBusinessStatusValue;
    requiresReview?: boolean;
    reviewReasonCode?: string | null;
    processingVersion?: string | null;
    processedAt?: Date | null;
    lastReprocessedAt?: Date | null;
    actorSnapshot?: Prisma.InputJsonValue;
    sourceMetadata?: Prisma.InputJsonValue | null;
    bundyRawEventIds?: readonly string[];
};

function stringArray(value: Prisma.JsonValue): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
}

function mapSchedule(schedule: UnifiedAttendanceRow["schedule"]) {
    if (!schedule) {
        return null;
    }

    return {
        internalId: schedule.id,
        scheduleId: schedule.scheduleId,
        workStart: toTimeKey(schedule.workStart),
        workEnd: toTimeKey(schedule.workEnd),
        breakStart: toTimeKey(schedule.breakStart),
        breakEnd: toTimeKey(schedule.breakEnd),
        shiftLabel: schedule.shiftLabel,
        workDays: stringArray(schedule.workDays),
        restDays: stringArray(schedule.restDays),
        workLocation: schedule.workLocation,
        effectiveFrom: schedule.effectiveFrom ? toDateKey(schedule.effectiveFrom) : null,
        effectiveTo: schedule.effectiveTo ? toDateKey(schedule.effectiveTo) : null,
    };
}

function mapAttendance(row: UnifiedAttendanceRow): UnifiedAttendanceView {
    return {
        id: row.id,
        employee: {
            internalId: row.employee.id,
            employeeId: row.employee.employeeId,
            displayName: row.employee.displayName,
            department: row.employee.department,
        },
        attendanceDate: toDateKey(row.attendanceDate),
        firstInAt: toIso(row.timeIn),
        lastOutAt: toIso(row.timeOut),
        firstInSource: row.timeInSource,
        lastOutSource: row.timeOutSource,
        firstInSourceReference: row.timeInSourceReference,
        lastOutSourceReference: row.timeOutSourceReference,
        technicalState: row.technicalState,
        businessStatus: row.businessStatus,
        schedule: mapSchedule(row.schedule),
        scheduleSnapshot: row.scheduleSnapshot,
        requiresReview: row.requiresReview,
        reviewReasonCode: row.reviewReasonCode,
        processedAt: toIso(row.processedAt),
        processingVersion: row.processingVersion,
        lastReprocessedAt: toIso(row.lastReprocessedAt),
        bundyEvidence: row.bundyEvidence
            .map((link) => ({
                id: link.id,
                rawEventId: link.bundyRawEvent.id,
                sourceLogId: link.bundyRawEvent.sourceLogId,
                importId: link.bundyRawEvent.importId,
                event: link.bundyRawEvent.event,
                occurredAt: link.bundyRawEvent.occurredAt.toISOString(),
            }))
            .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt)),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export type UnifiedAttendanceProcessingSource = {
    id: string;
    timeIn: Date | null;
    timeOut: Date | null;
    timeInSource: AttendanceSource | null;
    timeOutSource: AttendanceSource | null;
    timeInSourceReference: string | null;
    timeOutSourceReference: string | null;
    sourceMetadata: Prisma.JsonValue | null;
};

export async function findAttendanceProcessingSource(
    employeeId: string,
    attendanceDate: string,
): Promise<UnifiedAttendanceProcessingSource | null> {
    const row = await getRepositoryPrisma().attendanceRecord.findFirst({
        where: {
            employee: { employeeId },
            attendanceDate: toUtcDate(attendanceDate),
        },
        select: {
            id: true,
            timeIn: true,
            timeOut: true,
            timeInSource: true,
            timeOutSource: true,
            timeInSourceReference: true,
            timeOutSourceReference: true,
            sourceMetadata: true,
        },
    });

    return row;
}

function whereFor(filters: UnifiedAttendanceListFilters): Prisma.AttendanceRecordWhereInput {
    return {
        ...(filters.attendanceDate
            ? { attendanceDate: toUtcDate(filters.attendanceDate) }
            : {}),
        ...(!filters.attendanceDate && (filters.fromDate || filters.toDate)
            ? {
                attendanceDate: {
                    ...(filters.fromDate ? { gte: toUtcDate(filters.fromDate) } : {}),
                    ...(filters.toDate ? { lte: toUtcDate(filters.toDate) } : {}),
                },
            }
            : {}),
        ...(filters.employeeId ? { employee: { employeeId: filters.employeeId } } : {}),
        ...(filters.technicalState ? { technicalState: filters.technicalState } : {}),
        ...(filters.businessStatus ? { businessStatus: filters.businessStatus } : {}),
        ...(filters.requiresReview === undefined || filters.requiresReview === null
            ? {}
            : { requiresReview: filters.requiresReview }),
    };
}

function nullableJson(value: Prisma.InputJsonValue | null): Prisma.InputJsonValue | typeof Prisma.DbNull {
    return value === null ? Prisma.DbNull : value;
}

function defaultActorSnapshot(): Prisma.InputJsonValue {
    return toJson(toActorSnapshot({
        uid: "system:unified-attendance",
        username: "unified-attendance",
        displayName: "Unified Attendance Processor",
        role: "system",
    }));
}

async function resolveSchedule(
    transaction: Prisma.TransactionClient,
    employeeId: string,
    employeeScheduleId: string | null | undefined,
) {
    if (!employeeScheduleId) {
        return null;
    }

    const schedule = await transaction.employeeSchedule.findUnique({
        where: { id: employeeScheduleId },
        select: {
            ...scheduleSelect,
            employeeId: true,
        },
    });

    if (!schedule || schedule.employeeId !== employeeId) {
        throw new Error("The selected employee schedule does not belong to the attendance employee.");
    }

    return schedule;
}

function scheduleSnapshotFromRecord(
    schedule: Awaited<ReturnType<typeof resolveSchedule>>,
): Prisma.InputJsonValue | null {
    if (!schedule) {
        return null;
    }

    return toJson({
        scheduleId: schedule.scheduleId,
        workStart: toTimeKey(schedule.workStart),
        workEnd: toTimeKey(schedule.workEnd),
        breakStart: toTimeKey(schedule.breakStart),
        breakEnd: toTimeKey(schedule.breakEnd),
        shiftLabel: schedule.shiftLabel,
        workDays: stringArray(schedule.workDays),
        restDays: stringArray(schedule.restDays),
        workLocation: schedule.workLocation,
        effectiveFrom: schedule.effectiveFrom ? toDateKey(schedule.effectiveFrom) : null,
        effectiveTo: schedule.effectiveTo ? toDateKey(schedule.effectiveTo) : null,
    });
}

async function replaceBundyEvidenceLinks(
    transaction: Prisma.TransactionClient,
    attendanceRecordId: string,
    rawEventIds: readonly string[],
) {
    const uniqueRawEventIds = [...new Set(rawEventIds)];
    const attendanceRecord = await transaction.attendanceRecord.findUnique({
        where: { id: attendanceRecordId },
        select: { employeeId: true },
    });

    if (!attendanceRecord) {
        throw new Error("The Unified Attendance record was not found for evidence replacement.");
    }

    const rawEvents = uniqueRawEventIds.length
        ? await transaction.bundyRawEvent.findMany({
            where: { id: { in: uniqueRawEventIds } },
            select: {
                id: true,
                employeeId: true,
            },
        })
        : [];

    if (rawEvents.length !== uniqueRawEventIds.length) {
        throw new Error("One or more Bundy raw events do not exist and cannot be linked as evidence.");
    }

    if (rawEvents.some((event) => event.employeeId !== attendanceRecord.employeeId)) {
        throw new Error("Bundy evidence must belong to the same canonical employee as the Unified Attendance record.");
    }

    await transaction.attendanceBundyEvidence.deleteMany({
        where: { attendanceRecordId },
    });

    if (uniqueRawEventIds.length) {
        await transaction.attendanceBundyEvidence.createMany({
            data: uniqueRawEventIds.map((bundyRawEventId) => ({
                attendanceRecordId,
                bundyRawEventId,
            })),
        });
    }

    return uniqueRawEventIds.length;
}

export async function findUnifiedAttendanceById(
    id: string,
): Promise<UnifiedAttendanceView | null> {
    const row = await getRepositoryPrisma().attendanceRecord.findUnique({
        where: { id },
        select: unifiedAttendanceSelect,
    });

    return row ? mapAttendance(row) : null;
}

export async function findUnifiedAttendanceByEmployeeAndDate(
    employeeId: string,
    attendanceDate: string,
): Promise<UnifiedAttendanceView | null> {
    const row = await getRepositoryPrisma().attendanceRecord.findFirst({
        where: {
            employee: { employeeId },
            attendanceDate: toUtcDate(attendanceDate),
        },
        select: unifiedAttendanceSelect,
    });

    return row ? mapAttendance(row) : null;
}

export async function listUnifiedAttendance(
    filters: UnifiedAttendanceListFilters = {},
): Promise<{
    rows: UnifiedAttendanceView[];
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
}> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 25));
    const where = whereFor(filters);
    const [rows, total] = await Promise.all([
        getRepositoryPrisma().attendanceRecord.findMany({
            where,
            select: unifiedAttendanceSelect,
            orderBy: [
                { attendanceDate: "desc" },
                { employee: { employeeId: "asc" } },
                { id: "asc" },
            ],
            skip: (page - 1) * pageSize,
            take: pageSize + 1,
        }),
        getRepositoryPrisma().attendanceRecord.count({ where }),
    ]);

    return {
        rows: rows.slice(0, pageSize).map(mapAttendance),
        total,
        page,
        pageSize,
        hasNext: rows.length > pageSize,
    };
}

export async function countUnifiedAttendance(
    filters: UnifiedAttendanceListFilters = {},
): Promise<number> {
    return getRepositoryPrisma().attendanceRecord.count({ where: whereFor(filters) });
}

export async function upsertUnifiedAttendance(
    input: UnifiedAttendanceUpsertInput,
): Promise<UnifiedAttendanceView> {
    const prisma = getRepositoryPrisma();
    const now = new Date();

    return prisma.$transaction(async (transaction) => {
        const employee = await transaction.employee.findUnique({
            where: { employeeId: input.employeeId },
            select: { id: true },
        });

        if (!employee) {
            throw new Error("The employee reference for Unified Attendance was not found.");
        }

        const schedule = await resolveSchedule(
            transaction,
            employee.id,
            input.employeeScheduleId,
        );
        const scheduleSnapshot = input.scheduleSnapshot !== undefined
            ? input.scheduleSnapshot
            : scheduleSnapshotFromRecord(schedule);
        const actorSnapshot = input.actorSnapshot ?? defaultActorSnapshot();
        const status: AttendanceStatus = input.timeIn && input.timeOut
            ? "completed"
            : "present";
        const businessStatus: UnifiedAttendanceBusinessStatus = input.businessStatus ?? "UNCLASSIFIED";
        const requiresReview = input.requiresReview ?? input.technicalState === "NEEDS_REVIEW";
        const processedAt = input.processedAt === undefined ? now : input.processedAt;

        const createdData = {
            employeeId: employee.id,
            attendanceDate: toUtcDate(input.attendanceDate),
            timeIn: input.timeIn,
            timeOut: input.timeOut ?? null,
            timeInSource: input.timeInSource,
            timeOutSource: input.timeOutSource ?? null,
            timeInSourceReference: input.timeInSourceReference ?? null,
            timeOutSourceReference: input.timeOutSourceReference ?? null,
            status,
            timeInActorSnapshot: input.timeIn ? actorSnapshot : Prisma.DbNull,
            timeOutActorSnapshot: input.timeOut ? actorSnapshot : Prisma.DbNull,
            employeeScheduleId: input.employeeScheduleId ?? null,
            scheduleSnapshot: nullableJson(scheduleSnapshot),
            technicalState: input.technicalState,
            businessStatus,
            processedAt,
            processingVersion: input.processingVersion ?? null,
            lastReprocessedAt: input.lastReprocessedAt ?? null,
            requiresReview,
            reviewReasonCode: input.reviewReasonCode ?? null,
            ...(input.sourceMetadata !== undefined
                ? { sourceMetadata: nullableJson(input.sourceMetadata) }
                : {}),
        } satisfies Prisma.AttendanceRecordUncheckedCreateInput;

        const updatedData = {
            timeIn: input.timeIn,
            timeOut: input.timeOut ?? null,
            timeInSource: input.timeInSource,
            timeOutSource: input.timeOutSource ?? null,
            timeInSourceReference: input.timeInSourceReference ?? null,
            timeOutSourceReference: input.timeOutSourceReference ?? null,
            status,
            timeInActorSnapshot: input.timeIn ? actorSnapshot : Prisma.DbNull,
            timeOutActorSnapshot: input.timeOut ? actorSnapshot : Prisma.DbNull,
            technicalState: input.technicalState,
            processedAt,
            lastReprocessedAt: input.lastReprocessedAt === undefined ? now : input.lastReprocessedAt,
            ...(input.employeeScheduleId !== undefined
                ? {
                    employeeScheduleId: input.employeeScheduleId,
                    scheduleSnapshot: nullableJson(scheduleSnapshot),
                }
                : {}),
            ...(input.businessStatus !== undefined ? { businessStatus: input.businessStatus } : {}),
            ...(input.requiresReview !== undefined ? { requiresReview: input.requiresReview } : {}),
            ...(input.reviewReasonCode !== undefined ? { reviewReasonCode: input.reviewReasonCode } : {}),
            ...(input.processingVersion !== undefined ? { processingVersion: input.processingVersion } : {}),
            ...(input.sourceMetadata !== undefined
                ? { sourceMetadata: nullableJson(input.sourceMetadata) }
                : {}),
        } satisfies Prisma.AttendanceRecordUpdateInput;

        const row = await transaction.attendanceRecord.upsert({
            where: {
                employeeId_attendanceDate: {
                    employeeId: employee.id,
                    attendanceDate: toUtcDate(input.attendanceDate),
                },
            },
            create: createdData,
            update: updatedData,
            select: unifiedAttendanceSelect,
        });

        if (input.bundyRawEventIds !== undefined) {
            await replaceBundyEvidenceLinks(
                transaction,
                row.id,
                input.bundyRawEventIds,
            );
        }

        const finalRow = input.bundyRawEventIds === undefined
            ? row
            : await transaction.attendanceRecord.findUniqueOrThrow({
                where: { id: row.id },
                select: unifiedAttendanceSelect,
            });

        return mapAttendance(finalRow);
    });
}

export async function replaceUnifiedAttendanceBundyEvidence(
    attendanceRecordId: string,
    bundyRawEventIds: readonly string[],
): Promise<number> {
    return getRepositoryPrisma().$transaction((transaction) => replaceBundyEvidenceLinks(
        transaction,
        attendanceRecordId,
        bundyRawEventIds,
    ));
}

export async function hasBundyRawEventDependency(
    bundyRawEventId: string,
): Promise<boolean> {
    const count = await getRepositoryPrisma().attendanceBundyEvidence.count({
        where: { bundyRawEventId },
    });

    return count > 0;
}

export async function countBundyRawEventDependenciesForImport(
    importId: string,
): Promise<number> {
    return getRepositoryPrisma().attendanceBundyEvidence.count({
        where: {
            bundyRawEvent: { importId },
        },
    });
}
