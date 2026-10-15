import "server-only";

import { Prisma, type AttendanceCorrectionIssueType } from "@prisma/client";

import {
    getRepositoryPrisma,
    toDateKey,
    toIso,
    toJson,
    toTimeKey,
    toUtcDate,
} from "@/server/repositories/prisma/prisma-repository-helpers";
import { resolveEffectiveAttendance } from "@/server/attendance/effective-attendance";
import type { HrAttendanceReviewQuery } from "@/server/hr/attendance-review-query";
import type {
    HrAttendanceReviewData,
    HrAttendanceReviewRecord,
    HrReviewAttendanceValues,
    HrReviewCorrection,
    HrReviewEvidence,
} from "@/types/hr-attendance-review";

const reviewSelect = {
    id: true,
    attendanceDate: true,
    timeIn: true,
    timeOut: true,
    timeInSource: true,
    timeOutSource: true,
    technicalState: true,
    businessStatus: true,
    requiresReview: true,
    reviewReasonCode: true,
    scheduleSnapshot: true,
    sourceMetadata: true,
    hrVerificationStatus: true,
    hrVerifiedAt: true,
    hrVerifiedBySnapshot: true,
    employeeScheduleId: true,
    employee: {
        select: {
            employeeId: true,
            displayName: true,
            department: true,
            position: true,
        },
    },
    schedule: {
        select: {
            scheduleId: true,
            shiftLabel: true,
            workStart: true,
            workEnd: true,
            workDays: true,
        },
    },
    bundyEvidence: {
        select: {
            id: true,
            bundyRawEvent: {
                select: {
                    id: true,
                    sourceLogId: true,
                    event: true,
                    occurredAt: true,
                },
            },
        },
    },
    corrections: {
        select: {
            id: true,
            issueType: true,
            status: true,
            reason: true,
            requestedChanges: true,
            originalSnapshot: true,
            resultingSnapshot: true,
            submittedBySnapshot: true,
            submittedAt: true,
            reviewedBySnapshot: true,
            reviewedAt: true,
            reviewNote: true,
        },
        orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    },
} satisfies Prisma.AttendanceRecordSelect;

type ReviewRow = Prisma.AttendanceRecordGetPayload<{
    select: typeof reviewSelect;
}>;

type ReviewCorrectionRow = ReviewRow["corrections"][number];

const issueTypeLabels: Record<AttendanceCorrectionIssueType, string> = {
    MissingTimeIn: "Missing Time-In",
    MissingTimeOut: "Missing Time-Out",
    IncorrectTimeIn: "Incorrect Time-In",
    IncorrectTimeOut: "Incorrect Time-Out",
    TimeInAndTimeOutCorrection: "Time In and Time Out Correction",
};

export class HrAttendanceReviewRepositoryError extends Error {
    readonly code: string;
    readonly status: 404 | 409 | 500;

    constructor(code: string, message: string, status: 404 | 409 | 500 = 409) {
        super(message);
        this.name = "HrAttendanceReviewRepositoryError";
        this.code = code;
        this.status = status;
    }
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value : null;
}

function timestampValue(value: unknown): string | null {
    const timestamp = stringValue(value);
    return timestamp && !Number.isNaN(new Date(timestamp).getTime()) ? timestamp : null;
}

function attendanceValues(value: unknown): HrReviewAttendanceValues {
    const object = isObject(value) ? value : {};

    return {
        timeIn: timestampValue(object.timeIn),
        timeOut: timestampValue(object.timeOut),
    };
}

function sourceMetadataEvidence(
    recordId: string,
    value: unknown,
): HrReviewEvidence[] {
    const metadata = isObject(value) ? value : {};
    const qrEvidence = isObject(metadata.qrEvidence) ? metadata.qrEvidence : {};
    const evidence: HrReviewEvidence[] = [];

    const timeIn = timestampValue(qrEvidence.timeIn);
    if (timeIn) {
        evidence.push({
            id: `${recordId}:qr:in`,
            source: "QR",
            direction: "IN",
            occurredAt: timeIn,
            reference: stringValue(qrEvidence.timeInSourceReference) ?? recordId,
        });
    }

    const timeOut = timestampValue(qrEvidence.timeOut);
    if (timeOut) {
        evidence.push({
            id: `${recordId}:qr:out`,
            source: "QR",
            direction: "OUT",
            occurredAt: timeOut,
            reference: stringValue(qrEvidence.timeOutSourceReference) ?? recordId,
        });
    }

    return evidence;
}

function mapEvidence(row: ReviewRow): HrReviewEvidence[] {
    const bundy = row.bundyEvidence.map((evidence) => ({
        id: evidence.id,
        source: "BUNDY" as const,
        direction: evidence.bundyRawEvent.event,
        occurredAt: evidence.bundyRawEvent.occurredAt.toISOString(),
        reference: evidence.bundyRawEvent.sourceLogId,
    }));

    return [...bundy, ...sourceMetadataEvidence(row.id, row.sourceMetadata)]
        .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
}

function actorName(value: unknown): string {
    const actor = isObject(value) ? value : {};
    return stringValue(actor.displayName) ?? stringValue(actor.username) ?? "System";
}

function mapCorrection(row: ReviewCorrectionRow): HrReviewCorrection {
    const requestedObject = isObject(row.requestedChanges) ? row.requestedChanges : {};
    const originalObject = isObject(row.originalSnapshot) ? row.originalSnapshot : {};
    const resulting = row.resultingSnapshot ? attendanceValues(row.resultingSnapshot) : null;

    return {
        id: row.id,
        issueType: issueTypeLabels[row.issueType],
        status: row.status,
        reason: row.reason,
        remarks: stringValue(requestedObject.remarks),
        requested: attendanceValues(requestedObject),
        original: attendanceValues(originalObject),
        resulting,
        submittedBy: actorName(row.submittedBySnapshot),
        submittedAt: row.submittedAt.toISOString(),
        reviewedBy: row.reviewedBySnapshot ? actorName(row.reviewedBySnapshot) : null,
        reviewedAt: toIso(row.reviewedAt),
        reviewNote: row.reviewNote,
    };
}

function mapRecord(row: ReviewRow): HrAttendanceReviewRecord {
    const approvedCorrection = row.corrections.find(
        (correction) => correction.status === "approved",
    );
    const original = {
        timeIn: toIso(row.timeIn),
        timeOut: toIso(row.timeOut),
        timeInSource: row.timeInSource,
        timeOutSource: row.timeOutSource,
        technicalState: row.technicalState,
        businessStatus: row.businessStatus,
        requiresReview: row.requiresReview,
        reviewReasonCode: row.reviewReasonCode,
    } satisfies HrAttendanceReviewRecord["original"];

    return {
        id: row.id,
        employee: row.employee,
        attendanceDate: toDateKey(row.attendanceDate),
        attendanceDateLabel: toDateKey(row.attendanceDate),
        schedule: row.schedule
            ? {
                scheduleId: row.schedule.scheduleId,
                shiftLabel: row.schedule.shiftLabel,
                workStart: toTimeKey(row.schedule.workStart),
                workEnd: toTimeKey(row.schedule.workEnd),
                workDays: Array.isArray(row.schedule.workDays)
                    ? row.schedule.workDays.filter((item): item is string => typeof item === "string")
                    : [],
            }
            : null,
        original,
        effective: (() => {
            const effective = resolveEffectiveAttendance({
                original: {
                    timeIn: row.timeIn,
                    timeOut: row.timeOut,
                },
                approvedRequestedChanges: approvedCorrection?.requestedChanges,
            });
            return {
                timeIn: toIso(effective.timeIn),
                timeOut: toIso(effective.timeOut),
            };
        })(),
        verification: {
            status: row.hrVerificationStatus,
            verifiedAt: toIso(row.hrVerifiedAt),
            verifiedBy: row.hrVerifiedBySnapshot ? actorName(row.hrVerifiedBySnapshot) : null,
        },
        evidence: mapEvidence(row),
        corrections: row.corrections.map(mapCorrection),
    };
}

function baseWhere(filters: HrAttendanceReviewQuery): Prisma.AttendanceRecordWhereInput {
    const employeeConditions: Prisma.AttendanceRecordWhereInput[] = [];
    if (filters.search) {
        employeeConditions.push({
            employee: {
                OR: [
                    { employeeId: { contains: filters.search, mode: "insensitive" } },
                    { displayName: { contains: filters.search, mode: "insensitive" } },
                    { department: { contains: filters.search, mode: "insensitive" } },
                ],
            },
        });
    }
    if (filters.employeeId) {
        employeeConditions.push({ employee: { employeeId: filters.employeeId } });
    }
    if (filters.department) {
        employeeConditions.push({ employee: { department: filters.department } });
    }

    return {
        ...(employeeConditions.length ? { AND: employeeConditions } : {}),
        ...(filters.fromDate || filters.toDate
            ? {
                attendanceDate: {
                    ...(filters.fromDate ? { gte: toUtcDate(filters.fromDate) } : {}),
                    ...(filters.toDate ? { lte: toUtcDate(filters.toDate) } : {}),
                },
            }
            : {}),
        ...(filters.technicalState ? { technicalState: filters.technicalState } : {}),
        ...(filters.businessStatus ? { businessStatus: filters.businessStatus } : {}),
        ...(filters.reviewState === "needs-review" ? { requiresReview: true } : {}),
        ...(filters.correctionStatus
            ? { corrections: { some: { status: filters.correctionStatus } } }
            : {}),
        ...(filters.verificationStatus
            ? { hrVerificationStatus: filters.verificationStatus } : {}),
    };
}

function summaryWhere(filters: HrAttendanceReviewQuery): Prisma.AttendanceRecordWhereInput {
    const employeeConditions: Prisma.AttendanceRecordWhereInput[] = [];
    if (filters.search) {
        employeeConditions.push({
            employee: {
                OR: [
                    { employeeId: { contains: filters.search, mode: "insensitive" } },
                    { displayName: { contains: filters.search, mode: "insensitive" } },
                    { department: { contains: filters.search, mode: "insensitive" } },
                ],
            },
        });
    }
    if (filters.employeeId) {
        employeeConditions.push({ employee: { employeeId: filters.employeeId } });
    }
    if (filters.department) {
        employeeConditions.push({ employee: { department: filters.department } });
    }

    return {
        ...(employeeConditions.length ? { AND: employeeConditions } : {}),
        ...(filters.fromDate || filters.toDate
            ? {
                attendanceDate: {
                    ...(filters.fromDate ? { gte: toUtcDate(filters.fromDate) } : {}),
                    ...(filters.toDate ? { lte: toUtcDate(filters.toDate) } : {}),
                },
            }
            : {}),
    };
}

export async function listHrAttendanceReviewData(
    filters: HrAttendanceReviewQuery,
    permissions: HrAttendanceReviewData["permissions"],
): Promise<HrAttendanceReviewData> {
    const prisma = getRepositoryPrisma();
    const where = baseWhere(filters);
    const summaryBase = summaryWhere(filters);
    const page = Math.max(1, filters.page);
    const pageSize = filters.pageSize;

    const [rows, total, needsReview, missingIn, missingOut, pendingCorrections, readyCandidates, finalVerified, employees] = await Promise.all([
        prisma.attendanceRecord.findMany({
            where,
            select: reviewSelect,
            orderBy: [{ attendanceDate: "desc" }, { employee: { employeeId: "asc" } }, { id: "asc" }],
            skip: (page - 1) * pageSize,
            take: pageSize + 1,
        }),
        prisma.attendanceRecord.count({ where }),
        prisma.attendanceRecord.count({ where: { ...summaryBase, requiresReview: true } }),
        prisma.attendanceRecord.count({ where: { ...summaryBase, technicalState: "MISSING_IN" } }),
        prisma.attendanceRecord.count({ where: { ...summaryBase, technicalState: "MISSING_OUT" } }),
        prisma.attendanceRecord.count({ where: { ...summaryBase, corrections: { some: { status: "pending" } } } }),
        prisma.attendanceRecord.findMany({
            where: {
                ...summaryBase,
                hrVerificationStatus: "pending",
                corrections: { none: { status: "pending" } },
            },
            select: {
                timeIn: true,
                timeOut: true,
                corrections: {
                    where: { status: "approved" },
                    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
                    take: 1,
                    select: { requestedChanges: true },
                },
            },
        }),
        prisma.attendanceRecord.count({ where: { ...summaryBase, hrVerificationStatus: "verified" } }),
        prisma.employee.findMany({
            select: { employeeId: true, displayName: true, department: true },
            orderBy: { employeeId: "asc" },
        }),
    ]);

    return {
        records: rows.slice(0, pageSize).map(mapRecord),
        total,
        page,
        pageSize,
        hasNext: rows.length > pageSize,
        summary: {
            needsReview,
            missingIn,
            missingOut,
            pendingCorrections,
            readyForVerification: readyCandidates.filter((candidate) => {
                const effective = resolveEffectiveAttendance({
                    original: {
                        timeIn: candidate.timeIn,
                        timeOut: candidate.timeOut,
                    },
                    approvedRequestedChanges: candidate.corrections[0]?.requestedChanges,
                });
                return Boolean(effective.timeIn && effective.timeOut);
            }).length,
            finalVerified,
        },
        employees: employees.map((employee) => ({
            employeeId: employee.employeeId,
            displayName: employee.displayName,
        })),
        departments: Array.from(new Set(employees.map((employee) => employee.department))).sort(),
        permissions,
    };
}

export async function getHrAttendanceReviewRecord(
    attendanceRecordId: string,
): Promise<HrAttendanceReviewRecord | null> {
    const row = await getRepositoryPrisma().attendanceRecord.findUnique({
        where: { id: attendanceRecordId },
        select: reviewSelect,
    });

    return row ? mapRecord(row) : null;
}

export async function createHrAttendanceCorrection(input: {
    attendanceRecordId: string;
    issueType: AttendanceCorrectionIssueType;
    reason: string;
    remarks: string | null;
    requestedChanges: { timeIn?: Date; timeOut?: Date };
    submittedBy: { uid: string; username: string; displayName: string; role: string };
    evidence: HrReviewEvidence[];
}) {
    const prisma = getRepositoryPrisma();
    return prisma.$transaction(async (transaction) => {
        await transaction.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(2147483002)`);
        const record = await transaction.attendanceRecord.findUnique({
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
                hrVerificationStatus: true,
                corrections: {
                    where: { status: { in: ["pending", "approved"] } },
                    select: { id: true, status: true },
                },
            },
        });

        if (!record) {
            throw new HrAttendanceReviewRepositoryError(
                "HR_ATTENDANCE_NOT_FOUND",
                "The attendance record could not be found.",
                404,
            );
        }
        if (record.hrVerificationStatus === "verified") {
            throw new HrAttendanceReviewRepositoryError(
                "ATTENDANCE_FINAL_VERIFIED",
                "Final-verified attendance cannot receive a new correction.",
            );
        }
        if (record.corrections.length) {
            throw new HrAttendanceReviewRepositoryError(
                "ATTENDANCE_CORRECTION_CONFLICT",
                "This attendance record already has an active correction. Resolve it before creating another.",
            );
        }

        const submittedByUserId = await transaction.user.findUnique({
            where: { firebaseUid: input.submittedBy.uid },
            select: { id: true },
        });
        const originalSnapshot = {
            attendanceRecordId: record.id,
            attendanceDate: toDateKey(record.attendanceDate),
            timeIn: toIso(record.timeIn),
            timeOut: toIso(record.timeOut),
            timeInSource: record.timeInSource,
            timeOutSource: record.timeOutSource,
            status: record.status,
        };
        const requestedChanges = {
            ...(input.requestedChanges.timeIn
                ? { timeIn: input.requestedChanges.timeIn.toISOString() }
                : {}),
            ...(input.requestedChanges.timeOut
                ? { timeOut: input.requestedChanges.timeOut.toISOString() }
                : {}),
            ...(input.remarks ? { remarks: input.remarks } : {}),
        };

        return transaction.attendanceCorrection.create({
            data: {
                employeeId: record.employeeId,
                attendanceRecordId: record.id,
                attendanceDate: record.attendanceDate,
                issueType: input.issueType,
                status: "pending",
                reason: input.reason,
                originalSnapshot: toJson(originalSnapshot),
                requestedChanges: toJson(requestedChanges),
                changedFields: toJson([]),
                evidence: toJson(input.evidence),
                submittedByUserId: submittedByUserId?.id ?? null,
                submittedBySnapshot: toJson(input.submittedBy),
                submittedAt: new Date(),
            },
            select: { id: true, attendanceRecordId: true },
        });
    });
}

export async function finalVerifyHrAttendance(input: {
    attendanceRecordId: string;
    verifier: { uid: string; username: string; displayName: string; role: string };
}) {
    const prisma = getRepositoryPrisma();
    return prisma.$transaction(async (transaction) => {
        await transaction.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(2147483003)`);
        const record = await transaction.attendanceRecord.findUnique({
            where: { id: input.attendanceRecordId },
            select: {
                id: true,
                employeeId: true,
                attendanceDate: true,
                timeIn: true,
                timeOut: true,
                hrVerificationStatus: true,
                employee: { select: { employeeId: true, displayName: true } },
                corrections: {
                    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
                    select: { status: true, requestedChanges: true },
                },
            },
        });

        if (!record) {
            throw new HrAttendanceReviewRepositoryError(
                "HR_ATTENDANCE_NOT_FOUND",
                "The attendance record could not be found.",
                404,
            );
        }
        if (record.hrVerificationStatus === "verified") {
            return { id: record.id, alreadyVerified: true };
        }
        if (record.corrections.some((correction) => correction.status === "pending")) {
            throw new HrAttendanceReviewRepositoryError(
                "PENDING_CORRECTION_BLOCKS_VERIFICATION",
                "Resolve the pending correction before final verification.",
            );
        }

        const approved = record.corrections.find((correction) => correction.status === "approved");
        const effective = resolveEffectiveAttendance({
            original: {
                timeIn: record.timeIn,
                timeOut: record.timeOut,
            },
            approvedRequestedChanges: approved?.requestedChanges,
        });
        const effectiveTimeIn = effective.timeIn;
        const effectiveTimeOut = effective.timeOut;

        if (!effectiveTimeIn || !effectiveTimeOut) {
            throw new HrAttendanceReviewRepositoryError(
                "INCOMPLETE_ATTENDANCE_BLOCKS_VERIFICATION",
                "Both effective Time-In and Time-Out are required before final verification.",
            );
        }

        const verifierUser = await transaction.user.findUnique({
            where: { firebaseUid: input.verifier.uid },
            select: { id: true },
        });
        const verifiedAt = new Date();
        await transaction.attendanceRecord.update({
            where: { id: record.id },
            data: {
                hrVerificationStatus: "verified",
                hrVerifiedAt: verifiedAt,
                hrVerifiedByUserId: verifierUser?.id ?? null,
                hrVerifiedBySnapshot: toJson(input.verifier),
                payrollReadinessStatus: "ready",
                payrollReadinessReasons: toJson([]),
            },
        });

        return {
            id: record.id,
            alreadyVerified: false,
            employeeId: record.employee.employeeId,
            employeeName: record.employee.displayName,
            attendanceDate: toDateKey(record.attendanceDate),
            effectiveTimeIn: effectiveTimeIn.toISOString(),
            effectiveTimeOut: effectiveTimeOut.toISOString(),
            verifiedAt: verifiedAt.toISOString(),
        };
    });
}
