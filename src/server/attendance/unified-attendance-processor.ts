import "server-only";

import type {
    AttendanceSource,
    Prisma,
    UnifiedAttendanceBusinessStatus,
    UnifiedAttendanceTechnicalState,
} from "@prisma/client";

import { getEffectivePrismaEmployeeSchedule } from "@/server/repositories/employee-schedules/prisma-employee-schedule.repository";
import { getPrismaEmployeeByEmployeeId } from "@/server/repositories/employees/prisma-employee.repository";
import {
    findAttendanceProcessingSource,
    findUnifiedAttendanceByEmployeeAndDate,
    upsertUnifiedAttendance,
} from "@/server/repositories/attendance/unified-attendance.repository";
import { listBundyAttendanceEvidence } from "@/server/repositories/bundy/bundy.repository";
import { toJson } from "@/server/repositories/prisma/prisma-repository-helpers";
import {
    normalizeAttendanceEvidence,
    type NormalizedAttendanceEvidence,
} from "./unified-attendance-normalizer";

export const UNIFIED_ATTENDANCE_PROCESSING_VERSION = "UNIFIED-015B-v1";

export type UnifiedAttendanceProcessingOperation = "CREATED" | "UPDATED" | "UNCHANGED";

export type UnifiedAttendanceProcessingResult = {
    employeeId: string;
    attendanceDate: string;
    operation: UnifiedAttendanceProcessingOperation;
    attendanceRecordId: string;
    firstIn: string | null;
    lastOut: string | null;
    firstInSource: AttendanceSource | null;
    lastOutSource: AttendanceSource | null;
    firstInSourceReference: string | null;
    lastOutSourceReference: string | null;
    technicalState: UnifiedAttendanceTechnicalState;
    businessStatus: UnifiedAttendanceBusinessStatus;
    requiresReview: boolean;
    reviewReasons: string[];
    scheduleId: string | null;
    scheduleApplied: boolean;
    bundyEvidenceCount: number;
    qrEvidenceCount: number;
    warnings: string[];
};

export class UnifiedAttendanceProcessingError extends Error {
    readonly code:
        | "INVALID_ATTENDANCE_DATE"
        | "EMPLOYEE_NOT_FOUND"
        | "FINAL_VERIFIED_ATTENDANCE"
        | "ATTENDANCE_PROCESSING_FAILED";

    constructor(
        code: UnifiedAttendanceProcessingError["code"],
        message: string,
    ) {
        super(message);
        this.name = "UnifiedAttendanceProcessingError";
        this.code = code;
    }
}

type JsonObject = Record<string, unknown>;

type QrEvidenceSnapshot = {
    timeIn: string | null;
    timeOut: string | null;
    timeInSourceReference: string | null;
    timeOutSourceReference: string | null;
};

function isJsonObject(value: unknown): value is JsonObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
    return typeof value === "string" && value ? value : null;
}

function asQrSnapshot(value: unknown): QrEvidenceSnapshot | null {
    if (!isJsonObject(value)) {
        return null;
    }

    const timeIn = asString(value.timeIn);
    const timeOut = asString(value.timeOut);

    if (!timeIn && !timeOut) {
        return null;
    }

    return {
        timeIn,
        timeOut,
        timeInSourceReference: asString(value.timeInSourceReference),
        timeOutSourceReference: asString(value.timeOutSourceReference),
    };
}

function dateKeyIsValid(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function createQrEvidence(
    source: Awaited<ReturnType<typeof findAttendanceProcessingSource>>,
): { evidence: NormalizedAttendanceEvidence[]; snapshot: QrEvidenceSnapshot | null } {
    if (!source) {
        return { evidence: [], snapshot: null };
    }

    const metadata = isJsonObject(source.sourceMetadata) ? source.sourceMetadata : {};
    const storedSnapshot = asQrSnapshot(metadata.qrEvidence);
    const snapshot = storedSnapshot ?? {
        timeIn: source.timeInSource === "QR" && source.timeIn
            ? source.timeIn.toISOString()
            : null,
        timeOut: source.timeOutSource === "QR" && source.timeOut
            ? source.timeOut.toISOString()
            : null,
        timeInSourceReference: source.timeInSource === "QR"
            ? source.timeInSourceReference ?? source.id
            : null,
        timeOutSourceReference: source.timeOutSource === "QR"
            ? source.timeOutSourceReference ?? source.id
            : null,
    };

    const evidence: NormalizedAttendanceEvidence[] = [];
    if (snapshot.timeIn) {
        evidence.push({
            sourceRecordId: `${source.id}:time-in`,
            source: "QR",
            timestamp: new Date(snapshot.timeIn),
            direction: "IN",
            sourceReference: snapshot.timeInSourceReference ?? source.id,
        });
    }
    if (snapshot.timeOut) {
        evidence.push({
            sourceRecordId: `${source.id}:time-out`,
            source: "QR",
            timestamp: new Date(snapshot.timeOut),
            direction: "OUT",
            sourceReference: snapshot.timeOutSourceReference ?? source.id,
        });
    }

    return { evidence, snapshot: evidence.length ? snapshot : null };
}

function scheduleSnapshot(
    schedule: Awaited<ReturnType<typeof getEffectivePrismaEmployeeSchedule>>,
): Prisma.InputJsonValue | null {
    if (!schedule) {
        return null;
    }

    return toJson({
        scheduleId: schedule.scheduleId,
        workStart: schedule.workStart,
        workEnd: schedule.workEnd,
        breakStart: schedule.breakStart,
        breakEnd: schedule.breakEnd,
        shiftLabel: schedule.shiftLabel,
        workDays: schedule.workDays,
        restDays: schedule.restDays,
        workLocation: schedule.workLocation,
        effectiveFrom: schedule.effectiveFrom,
        effectiveTo: schedule.effectiveTo,
    });
}

function sameStringArray(left: readonly string[], right: readonly string[]) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isSameResult(
    existing: Awaited<ReturnType<typeof findUnifiedAttendanceByEmployeeAndDate>>,
    input: {
        firstIn: NormalizedAttendanceEvidence | null;
        lastOut: NormalizedAttendanceEvidence | null;
        technicalState: UnifiedAttendanceProcessingResult["technicalState"];
        requiresReview: boolean;
        reviewReasonCode: string | null;
        scheduleId: string | null;
        bundyRawEventIds: string[];
    },
) {
    if (!existing) {
        return false;
    }

    const existingBundyIds = existing.bundyEvidence
        .map((evidence) => evidence.rawEventId)
        .sort();
    const currentBundyIds = [...input.bundyRawEventIds].sort();

    return existing.firstInAt === (input.firstIn?.timestamp.toISOString() ?? null)
        && existing.lastOutAt === (input.lastOut?.timestamp.toISOString() ?? null)
        && existing.firstInSource === (input.firstIn?.source ?? null)
        && existing.lastOutSource === (input.lastOut?.source ?? null)
        && existing.firstInSourceReference === (input.firstIn?.sourceReference ?? null)
        && existing.lastOutSourceReference === (input.lastOut?.sourceReference ?? null)
        && existing.technicalState === input.technicalState
        && existing.businessStatus === "UNCLASSIFIED"
        && existing.requiresReview === input.requiresReview
        && existing.reviewReasonCode === input.reviewReasonCode
        && (existing.schedule?.internalId ?? null) === input.scheduleId
        && sameStringArray(existingBundyIds, currentBundyIds);
}

export async function processUnifiedAttendanceForEmployeeDate(input: {
    employeeId: string;
    attendanceDate: string;
}): Promise<UnifiedAttendanceProcessingResult> {
    if (!dateKeyIsValid(input.attendanceDate)) {
        throw new UnifiedAttendanceProcessingError(
            "INVALID_ATTENDANCE_DATE",
            "The attendance date must use a valid YYYY-MM-DD value.",
        );
    }

    const employee = await getPrismaEmployeeByEmployeeId(input.employeeId);
    if (!employee) {
        throw new UnifiedAttendanceProcessingError(
            "EMPLOYEE_NOT_FOUND",
            "The canonical HRPS Employee was not found; no AttendanceRecord was created.",
        );
    }

    const [schedule, bundyEvidence, source, existing] = await Promise.all([
        getEffectivePrismaEmployeeSchedule(input.employeeId, new Date(`${input.attendanceDate}T00:00:00.000Z`)),
        listBundyAttendanceEvidence(input.employeeId, input.attendanceDate),
        findAttendanceProcessingSource(input.employeeId, input.attendanceDate),
        findUnifiedAttendanceByEmployeeAndDate(input.employeeId, input.attendanceDate),
    ]);

    const qr = createQrEvidence(source);
    const normalized = normalizeAttendanceEvidence([
        ...bundyEvidence.map((event) => ({
            sourceRecordId: event.id,
            source: "BUNDY" as const,
            timestamp: event.occurredAt,
            direction: event.event,
            sourceReference: event.sourceLogId,
        })),
        ...qr.evidence,
    ]);
    const reviewReasons = [...normalized.reviewReasons];
    if (!schedule) {
        reviewReasons.push("NO_SCHEDULE");
    }
    const requiresReview = normalized.requiresReview || !schedule;
    const reviewReasonCode = reviewReasons[0] ?? null;
    const metadata = isJsonObject(source?.sourceMetadata) ? source.sourceMetadata : {};
    const sourceMetadata = {
        ...metadata,
        processor: UNIFIED_ATTENDANCE_PROCESSING_VERSION,
        ...(qr.snapshot ? { qrEvidence: qr.snapshot } : {}),
    };
    const bundyRawEventIds = bundyEvidence.map((event) => event.id);
    const operation = isSameResult(existing, {
        firstIn: normalized.firstIn,
        lastOut: normalized.lastOut,
        technicalState: normalized.technicalState,
        requiresReview,
        reviewReasonCode,
        scheduleId: schedule?.internalId ?? null,
        bundyRawEventIds,
    })
        ? "UNCHANGED"
        : existing
            ? "UPDATED"
            : "CREATED";
    if (existing?.hrVerificationStatus === "verified") {
        throw new UnifiedAttendanceProcessingError(
            "FINAL_VERIFIED_ATTENDANCE",
            "Final-verified attendance cannot be reprocessed.",
        );
    }
    const persisted = await upsertUnifiedAttendance({
        employeeId: input.employeeId,
        attendanceDate: input.attendanceDate,
        employeeScheduleId: schedule?.internalId ?? null,
        scheduleSnapshot: scheduleSnapshot(schedule),
        timeIn: normalized.firstIn?.timestamp ?? null,
        timeOut: normalized.lastOut?.timestamp ?? null,
        timeInSource: normalized.firstIn?.source ?? null,
        timeOutSource: normalized.lastOut?.source ?? null,
        timeInSourceReference: normalized.firstIn?.sourceReference ?? null,
        timeOutSourceReference: normalized.lastOut?.sourceReference ?? null,
        technicalState: normalized.technicalState,
        businessStatus: "UNCLASSIFIED",
        requiresReview,
        reviewReasonCode,
        processingVersion: UNIFIED_ATTENDANCE_PROCESSING_VERSION,
        sourceMetadata: toJson(sourceMetadata),
        bundyRawEventIds,
    });

    return {
        employeeId: input.employeeId,
        attendanceDate: input.attendanceDate,
        operation,
        attendanceRecordId: persisted.id,
        firstIn: persisted.firstInAt,
        lastOut: persisted.lastOutAt,
        firstInSource: persisted.firstInSource,
        lastOutSource: persisted.lastOutSource,
        firstInSourceReference: persisted.firstInSourceReference,
        lastOutSourceReference: persisted.lastOutSourceReference,
        technicalState: persisted.technicalState,
        businessStatus: persisted.businessStatus,
        requiresReview: persisted.requiresReview,
        reviewReasons,
        scheduleId: schedule?.scheduleId ?? null,
        scheduleApplied: Boolean(schedule),
        bundyEvidenceCount: bundyEvidence.length,
        qrEvidenceCount: qr.evidence.length,
        warnings: !schedule
            ? ["No authoritative HRPS schedule was effective for this attendance date."]
            : [],
    };
}
