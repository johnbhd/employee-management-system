import "server-only";

import type { AttendanceSource, AttendanceStatus, HrVerificationStatus, PayrollReadinessStatus, Prisma } from "@prisma/client";

import { determineQrAttendanceAction } from "@/server/attendance/qr/qr-attendance-state";
import {
    getRepositoryPrisma,
    toDateKey,
    toIso,
    toJsonObject,
} from "@/server/repositories/prisma/prisma-repository-helpers";

export type PrismaAttendanceView = {
    id: string;
    employeeId: string;
    employeeInternalId: string;
    employeeName: string;
    department: string;
    attendanceDate: string;
    timeIn: string;
    timeOut: string | null;
    timeInSource: AttendanceSource;
    timeOutSource: AttendanceSource | null;
    timeInSourceReference: string | null;
    timeOutSourceReference: string | null;
    timeInActorSnapshot: unknown;
    timeOutActorSnapshot: unknown;
    hrVerifiedBySnapshot: unknown;
    status: AttendanceStatus;
    hrVerificationStatus: HrVerificationStatus;
    hrVerifiedAt: string | null;
    payrollReadinessStatus: PayrollReadinessStatus;
    payrollReadinessReasons: unknown[];
    correctionMetadata: Record<string, unknown>;
    sourceMetadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
};

export type PrismaAttendanceFilters = {
    attendanceDate?: string | null;
    fromDate?: string | null;
    toDate?: string | null;
    attendanceMonth?: string | null;
    employeeId?: string | null;
    source?: AttendanceSource | null;
    status?: AttendanceStatus | null;
    hrVerificationStatus?: HrVerificationStatus | null;
    payrollReadinessStatus?: PayrollReadinessStatus | null;
    page?: number;
    pageSize?: number;
};

const attendanceSelect = {
    id: true,
    attendanceDate: true,
    timeIn: true,
    timeOut: true,
    timeInSource: true,
    timeOutSource: true,
    timeInSourceReference: true,
    timeOutSourceReference: true,
    timeInActorSnapshot: true,
    timeOutActorSnapshot: true,
    hrVerifiedBySnapshot: true,
    status: true,
    hrVerificationStatus: true,
    hrVerifiedAt: true,
    payrollReadinessStatus: true,
    payrollReadinessReasons: true,
    correctionMetadata: true,
    sourceMetadata: true,
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
} satisfies Prisma.AttendanceRecordSelect;

type AttendanceRow = Prisma.AttendanceRecordGetPayload<{
    select: typeof attendanceSelect;
}>;

function mapAttendance(row: AttendanceRow): PrismaAttendanceView {
    if (!row.timeIn || !row.timeInSource || row.timeInActorSnapshot === null) {
        throw new Error("The attendance record has no time-in evidence for the legacy attendance view.");
    }

    return {
        id: row.id,
        employeeId: row.employee.employeeId,
        employeeInternalId: row.employee.id,
        employeeName: row.employee.displayName,
        department: row.employee.department,
        attendanceDate: toDateKey(row.attendanceDate),
        timeIn: row.timeIn.toISOString(),
        timeOut: toIso(row.timeOut),
        timeInSource: row.timeInSource,
        timeOutSource: row.timeOutSource,
        timeInSourceReference: row.timeInSourceReference,
        timeOutSourceReference: row.timeOutSourceReference,
        timeInActorSnapshot: row.timeInActorSnapshot,
        timeOutActorSnapshot: row.timeOutActorSnapshot,
        hrVerifiedBySnapshot: row.hrVerifiedBySnapshot,
        status: row.status,
        hrVerificationStatus: row.hrVerificationStatus,
        hrVerifiedAt: toIso(row.hrVerifiedAt),
        payrollReadinessStatus: row.payrollReadinessStatus,
        payrollReadinessReasons: Array.isArray(row.payrollReadinessReasons)
            ? row.payrollReadinessReasons
            : [],
        correctionMetadata: toJsonObject(row.correctionMetadata),
        sourceMetadata: toJsonObject(row.sourceMetadata),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

function whereFor(filters: PrismaAttendanceFilters): Prisma.AttendanceRecordWhereInput {
    const monthStart = filters.attendanceMonth
        ? new Date(`${filters.attendanceMonth}-01T00:00:00.000Z`)
        : null;
    const monthEnd = filters.attendanceMonth
        ? new Date(`${filters.attendanceMonth}-01T00:00:00.000Z`)
        : null;
    if (monthEnd) {
        monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
    }

    return {
        timeIn: { not: null },
        ...(filters.attendanceDate ? { attendanceDate: new Date(`${filters.attendanceDate}T00:00:00.000Z`) } : {}),
        ...(!filters.attendanceDate && (filters.fromDate || filters.toDate)
            ? {
                attendanceDate: {
                    ...(filters.fromDate ? { gte: new Date(`${filters.fromDate}T00:00:00.000Z`) } : {}),
                    ...(filters.toDate ? { lte: new Date(`${filters.toDate}T00:00:00.000Z`) } : {}),
                },
            }
            : {}),
        ...(!filters.attendanceDate && !filters.fromDate && !filters.toDate && monthStart && monthEnd
            ? { attendanceDate: { gte: monthStart, lt: monthEnd } }
            : {}),
        ...(filters.employeeId ? { employee: { employeeId: filters.employeeId } } : {}),
        ...(filters.source
            ? {
                OR: [
                    { timeInSource: filters.source },
                    { timeOutSource: filters.source },
                ],
            }
            : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.hrVerificationStatus ? { hrVerificationStatus: filters.hrVerificationStatus } : {}),
        ...(filters.payrollReadinessStatus ? { payrollReadinessStatus: filters.payrollReadinessStatus } : {}),
    };
}

export async function getPrismaAttendanceById(
    id: string,
): Promise<PrismaAttendanceView | null> {
    const row = await getRepositoryPrisma().attendanceRecord.findUnique({
        where: { id },
        select: attendanceSelect,
    });

    return row && row.timeIn && row.timeInSource && row.timeInActorSnapshot !== null
        ? mapAttendance(row)
        : null;
}

export async function getPrismaAttendanceByEmployeeAndDate(
    employeeId: string,
    attendanceDate: string,
): Promise<PrismaAttendanceView | null> {
    const row = await getRepositoryPrisma().attendanceRecord.findFirst({
        where: {
            employee: { employeeId },
            attendanceDate: new Date(`${attendanceDate}T00:00:00.000Z`),
        },
        select: attendanceSelect,
    });

    return row && row.timeIn && row.timeInSource && row.timeInActorSnapshot !== null
        ? mapAttendance(row)
        : null;
}

export async function listPrismaAttendance(
    filters: PrismaAttendanceFilters = {},
): Promise<{ rows: PrismaAttendanceView[]; total: number; hasNext: boolean }> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 50));
    const where = whereFor(filters);
    const [rows, total] = await Promise.all([
        getRepositoryPrisma().attendanceRecord.findMany({
            where,
            select: attendanceSelect,
            orderBy: [{ attendanceDate: "desc" }, { timeIn: "desc" }, { id: "desc" }],
            skip: (page - 1) * pageSize,
            take: pageSize + 1,
        }),
        getRepositoryPrisma().attendanceRecord.count({ where }),
    ]);

    return {
        rows: rows.slice(0, pageSize).map(mapAttendance),
        total,
        hasNext: rows.length > pageSize,
    };
}

export async function getPrismaAttendanceSummary(
    filters: Omit<PrismaAttendanceFilters, "page" | "pageSize"> = {},
) {
    const where = whereFor(filters);
    const [total, verified, ready, bySource, byStatus] = await Promise.all([
        getRepositoryPrisma().attendanceRecord.count({ where }),
        getRepositoryPrisma().attendanceRecord.count({
            where: { ...where, hrVerificationStatus: "verified" },
        }),
        getRepositoryPrisma().attendanceRecord.count({
            where: { ...where, payrollReadinessStatus: "ready" },
        }),
        getRepositoryPrisma().attendanceRecord.groupBy({
            by: ["timeInSource"],
            where,
            _count: { _all: true },
        }),
        getRepositoryPrisma().attendanceRecord.groupBy({
            by: ["status"],
            where,
            _count: { _all: true },
        }),
    ]);

    return {
        total,
        verified,
        ready,
        bySource: Object.fromEntries(bySource.map((entry) => [entry.timeInSource, entry._count._all])),
        byStatus: Object.fromEntries(byStatus.map((entry) => [entry.status, entry._count._all])),
    };
}

export async function listPrismaAttendanceForAuthenticatedUser(
    userId: string,
    filters: Omit<PrismaAttendanceFilters, "employeeId"> = {},
) {
    const user = await getRepositoryPrisma().user.findUnique({
        where: { id: userId },
        select: { employee: { select: { employeeId: true } } },
    });

    if (!user?.employee) {
        return { rows: [], total: 0, hasNext: false };
    }

    return listPrismaAttendance({ ...filters, employeeId: user.employee.employeeId });
}

export async function recordPrismaQrAttendance(input: {
    employeeId: string;
    attendanceDate: string;
    occurredAt: Date;
    scannerOperator: {
        uid: string;
        username: string;
        displayName: string;
        role: "admin" | "hr";
    };
}) {
    const prisma = getRepositoryPrisma();
    const result = await prisma.$transaction(async (transaction) => {
        const employee = await transaction.employee.findUnique({
            where: { employeeId: input.employeeId },
        });

        if (!employee) {
            throw new Error("The employee reference for QR attendance was not found.");
        }

        const existing = await transaction.attendanceRecord.findUnique({
            where: {
                employeeId_attendanceDate: {
                    employeeId: employee.id,
                    attendanceDate: new Date(`${input.attendanceDate}T00:00:00.000Z`),
                },
            },
            select: attendanceSelect,
        });
        const operatorUser = await transaction.user.findUnique({
            where: { firebaseUid: input.scannerOperator.uid },
            select: { id: true },
        });

        if (!existing) {
            const created = await transaction.attendanceRecord.create({
                data: {
                    employeeId: employee.id,
                    attendanceDate: new Date(`${input.attendanceDate}T00:00:00.000Z`),
                    timeIn: input.occurredAt,
                    timeInSource: "QR",
                    timeInActorSnapshot: input.scannerOperator,
                    status: "present",
                    technicalState: "MISSING_OUT",
                    processedAt: new Date(),
                    timeInOperatorUserId: operatorUser?.id,
                    sourceMetadata: { source: "QR" },
                },
                select: attendanceSelect,
            });

            return { action: "time_in" as const, record: mapAttendance(created) };
        }

        if (!existing.timeIn || !existing.timeInSource || existing.timeInActorSnapshot === null) {
            const updated = await transaction.attendanceRecord.update({
                where: { id: existing.id },
                data: {
                    timeIn: input.occurredAt,
                    timeInSource: "QR",
                    timeInSourceReference: null,
                    timeInOperatorUserId: operatorUser?.id,
                    timeInActorSnapshot: input.scannerOperator,
                    status: existing.timeOut ? "completed" : "present",
                    technicalState: existing.timeOut ? "COMPLETE" : "MISSING_OUT",
                    processedAt: new Date(),
                    sourceMetadata: { source: "QR" },
                },
                select: attendanceSelect,
            });

            return { action: "time_in" as const, record: mapAttendance(updated) };
        }

        const action = determineQrAttendanceAction(
            { timeIn: existing.timeIn, timeOut: existing.timeOut },
            input.occurredAt,
        );

        if (action !== "time_out") {
            return { action, record: mapAttendance(existing) };
        }

        const updated = await transaction.attendanceRecord.update({
            where: { id: existing.id },
            data: {
                timeOut: input.occurredAt,
                timeOutSource: "QR",
                timeOutSourceReference: null,
                timeOutOperatorUserId: operatorUser?.id,
                timeOutActorSnapshot: input.scannerOperator,
                status: "completed",
                technicalState: "COMPLETE",
                processedAt: new Date(),
            },
            select: attendanceSelect,
        });

        return { action, record: mapAttendance(updated) };
    });

    return result;
}

