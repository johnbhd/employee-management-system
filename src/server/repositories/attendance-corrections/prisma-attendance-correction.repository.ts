import "server-only";

import type { AttendanceCorrectionIssueType, AttendanceCorrectionStatus, Prisma } from "@prisma/client";

import {
    getRepositoryPrisma,
    toDateKey,
    toIso,
    toJson,
    toJsonArray,
    toJsonObject,
} from "@/server/repositories/prisma/prisma-repository-helpers";

export type PrismaAttendanceCorrectionView = {
    id: string;
    attendanceRecordId: string;
    employeeId: string;
    employeeName: string;
    department: string;
    attendanceDate: string;
    issueType: string;
    status: AttendanceCorrectionStatus;
    reason: string;
    originalAttendance: Record<string, unknown> | null;
    requestedChanges: Record<string, unknown>;
    resultingAttendance: Record<string, unknown> | null;
    changedFields: unknown[];
    evidence: unknown[];
    submittedBy: Record<string, unknown>;
    submittedAt: string;
    reviewedBy: Record<string, unknown> | null;
    reviewedAt: string | null;
    reviewNote: string | null;
    updatedAt: string;
};

const correctionSelect = {
    id: true,
    attendanceRecordId: true,
    attendanceDate: true,
    issueType: true,
    status: true,
    reason: true,
    originalSnapshot: true,
    requestedChanges: true,
    resultingSnapshot: true,
    changedFields: true,
    evidence: true,
    submittedBySnapshot: true,
    submittedAt: true,
    reviewedBySnapshot: true,
    reviewedAt: true,
    reviewNote: true,
    updatedAt: true,
    employee: {
        select: {
            employeeId: true,
            displayName: true,
            department: true,
        },
    },
} satisfies Prisma.AttendanceCorrectionSelect;

type CorrectionRow = Prisma.AttendanceCorrectionGetPayload<{
    select: typeof correctionSelect;
}>;

const issueTypeMap: Record<string, AttendanceCorrectionIssueType> = {
    "Missing Time-In": "MissingTimeIn",
    "Missing Time-Out": "MissingTimeOut",
    "Incorrect Time-In": "IncorrectTimeIn",
    "Incorrect Time-Out": "IncorrectTimeOut",
    "Time In and Time Out Correction": "TimeInAndTimeOutCorrection",
};

function mapIssueType(value: AttendanceCorrectionIssueType): string {
    return Object.entries(issueTypeMap).find(([, enumValue]) => enumValue === value)?.[0] ?? value;
}

function mapCorrection(row: CorrectionRow): PrismaAttendanceCorrectionView {
    return {
        id: row.id,
        attendanceRecordId: row.attendanceRecordId,
        employeeId: row.employee.employeeId,
        employeeName: row.employee.displayName,
        department: row.employee.department,
        attendanceDate: toDateKey(row.attendanceDate),
        issueType: mapIssueType(row.issueType),
        status: row.status,
        reason: row.reason,
        originalAttendance: row.originalSnapshot && typeof row.originalSnapshot === "object" && !Array.isArray(row.originalSnapshot)
            ? row.originalSnapshot as Record<string, unknown>
            : null,
        requestedChanges: toJsonObject(row.requestedChanges),
        resultingAttendance: row.resultingSnapshot && typeof row.resultingSnapshot === "object" && !Array.isArray(row.resultingSnapshot)
            ? row.resultingSnapshot as Record<string, unknown>
            : null,
        changedFields: toJsonArray(row.changedFields),
        evidence: toJsonArray(row.evidence),
        submittedBy: toJsonObject(row.submittedBySnapshot),
        submittedAt: row.submittedAt.toISOString(),
        reviewedBy: row.reviewedBySnapshot ? toJsonObject(row.reviewedBySnapshot) : null,
        reviewedAt: toIso(row.reviewedAt),
        reviewNote: row.reviewNote,
        updatedAt: row.updatedAt.toISOString(),
    };
}

function attendanceSnapshot(row: {
    id: string;
    attendanceDate: Date;
    timeIn: Date | null;
    timeOut: Date | null;
    timeInSource: string | null;
    timeOutSource: string | null;
    status: string;
}) {
    return {
        attendanceRecordId: row.id,
        attendanceDate: toDateKey(row.attendanceDate),
        timeIn: row.timeIn?.toISOString() ?? null,
        timeOut: toIso(row.timeOut),
        timeInSource: row.timeInSource,
        timeOutSource: row.timeOutSource,
        status: row.status,
    };
}

export async function getPrismaAttendanceCorrectionById(
    id: string,
): Promise<PrismaAttendanceCorrectionView | null> {
    const row = await getRepositoryPrisma().attendanceCorrection.findUnique({
        where: { id },
        select: correctionSelect,
    });

    return row ? mapCorrection(row) : null;
}

export async function listPrismaAttendanceCorrections(input: {
    status?: AttendanceCorrectionStatus;
    employeeId?: string;
    page?: number;
    pageSize?: number;
} = {}) {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 50));
    const where: Prisma.AttendanceCorrectionWhereInput = {
        ...(input.status ? { status: input.status } : {}),
        ...(input.employeeId ? { employee: { employeeId: input.employeeId } } : {}),
    };
    const [rows, total] = await Promise.all([
        getRepositoryPrisma().attendanceCorrection.findMany({
            where,
            select: correctionSelect,
            orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
            skip: (page - 1) * pageSize,
            take: pageSize + 1,
        }),
        getRepositoryPrisma().attendanceCorrection.count({ where }),
    ]);

    return {
        rows: rows.slice(0, pageSize).map(mapCorrection),
        total,
        hasNext: rows.length > pageSize,
    };
}

export async function createPrismaAttendanceCorrection(input: {
    employeeId: string;
    attendanceRecordId: string;
    issueType: string;
    reason: string;
    requestedChanges: { timeIn?: Date; timeOut?: Date };
    submittedBy: Record<string, unknown>;
    evidence?: unknown[];
}): Promise<PrismaAttendanceCorrectionView> {
    const prisma = getRepositoryPrisma();
    const employee = await prisma.employee.findUnique({
        where: { employeeId: input.employeeId },
        select: { id: true },
    });
    if (!employee) {
        throw new Error("The employee reference for this correction is unavailable.");
    }

    const attendance = await prisma.attendanceRecord.findUnique({
        where: { id: input.attendanceRecordId },
        select: {
            id: true,
            employeeId: true,
            attendanceDate: true,
            timeIn: true,
            timeOut: true,
            timeInSource: true,
            timeOutSource: true,
            status: true,
        },
    });
    if (!attendance || attendance.employeeId !== employee.id) {
        throw new Error("The linked attendance record does not match the employee.");
    }

    const submittedByUserId = typeof input.submittedBy.uid === "string"
        ? (await prisma.user.findUnique({
            where: { firebaseUid: input.submittedBy.uid },
            select: { id: true },
        }))?.id
        : null;
    const snapshot = attendanceSnapshot(attendance);
    const row = await prisma.attendanceCorrection.create({
        data: {
            employeeId: employee.id,
            attendanceRecordId: attendance.id,
            attendanceDate: attendance.attendanceDate,
            issueType: issueTypeMap[input.issueType] ?? input.issueType as AttendanceCorrectionIssueType,
            status: "pending",
            reason: input.reason,
            originalSnapshot: toJson(snapshot),
            requestedChanges: toJson({
                ...(input.requestedChanges.timeIn ? { timeIn: input.requestedChanges.timeIn.toISOString() } : {}),
                ...(input.requestedChanges.timeOut ? { timeOut: input.requestedChanges.timeOut.toISOString() } : {}),
            }),
            changedFields: [],
            evidence: toJson(input.evidence ?? []),
            submittedByUserId,
            submittedBySnapshot: toJson(input.submittedBy),
            submittedAt: new Date(),
        },
        select: correctionSelect,
    });

    return mapCorrection(row);
}

export async function applyPrismaAttendanceCorrectionDecision(input: {
    requestId: string;
    decision: "approve" | "reject";
    reviewNote: string | null;
    reviewer: Record<string, unknown>;
}, transaction?: Prisma.TransactionClient): Promise<PrismaAttendanceCorrectionView> {
    const apply = async (transaction: Prisma.TransactionClient) => {
        const request = await transaction.attendanceCorrection.findUnique({
            where: { id: input.requestId },
            select: {
                ...correctionSelect,
                attendance: {
                    select: {
                        id: true,
                        attendanceDate: true,
                        timeIn: true,
                        timeOut: true,
                        timeInSource: true,
                        timeOutSource: true,
                        status: true,
                        hrVerificationStatus: true,
                    },
                },
            },
        });
        if (!request) {
            throw new Error("The attendance correction request could not be found.");
        }
        if (request.status !== "pending") {
            throw new Error(`This correction request is already ${request.status}.`);
        }
        if (request.attendance.hrVerificationStatus === "verified") {
            throw new Error("Final-verified attendance cannot be changed.");
        }

        const reviewerUserId = typeof input.reviewer.uid === "string"
            ? (await transaction.user.findUnique({
                where: { firebaseUid: input.reviewer.uid },
                select: { id: true },
            }))?.id
            : null;
        const requested = toJsonObject(request.requestedChanges);
        const attendance = request.attendance;
        const nextTimeIn = input.decision === "approve" && typeof requested.timeIn === "string"
            ? new Date(requested.timeIn)
            : attendance.timeIn;
        const nextTimeOut = input.decision === "approve" && typeof requested.timeOut === "string"
            ? new Date(requested.timeOut)
            : attendance.timeOut;
        const nextStatus = nextTimeIn && nextTimeOut ? "completed" : "present";
        const resulting = input.decision === "approve"
            ? attendanceSnapshot({ ...attendance, timeIn: nextTimeIn, timeOut: nextTimeOut, status: nextStatus })
            : null;
        const changedFields = input.decision === "approve"
            ? [
                ...(nextTimeIn?.getTime() !== attendance.timeIn?.getTime()
                    && nextTimeIn
                    ? [{ field: "timeIn", previousValue: attendance.timeIn?.toISOString() ?? null, newValue: nextTimeIn.toISOString() }]
                    : []),
                ...(nextTimeOut?.getTime() !== attendance.timeOut?.getTime()
                    ? [{ field: "timeOut", previousValue: attendance.timeOut?.toISOString() ?? null, newValue: nextTimeOut?.toISOString() ?? attendance.timeOut?.toISOString() }]
                    : []),
            ]
            : [];

        return transaction.attendanceCorrection.update({
            where: { id: request.id },
            data: {
                status: input.decision === "approve" ? "approved" : "rejected",
                reviewedByUserId: reviewerUserId,
                reviewedBySnapshot: toJson(input.reviewer),
                reviewedAt: new Date(),
                reviewNote: input.reviewNote,
                resultingSnapshot: toJson(resulting),
                changedFields: toJson(changedFields),
            },
            select: correctionSelect,
        });
    };

    const row = transaction
        ? await apply(transaction)
        : await getRepositoryPrisma().$transaction(apply);

    return mapCorrection(row);
}

