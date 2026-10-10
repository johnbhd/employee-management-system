import "server-only";

import {
    FieldValue,
    Timestamp,
    type DocumentData,
} from "firebase-admin/firestore";

import {
    getFirebaseAdminDb,
} from "@/lib/firebase/server";
import type { SessionUser } from "@/types/auth";
import type {
    AttendanceCorrectionDecision,
    AttendanceCorrectionIssueType,
    AttendanceCorrectionStatus,
} from "@/types/attendance-correction";

import {
    parseStoredQrAttendanceRecord,
    type StoredQrAttendanceRecord,
} from "../attendance/attendance.repository";

const correctionCollection = "attendanceCorrectionRequests";
const attendanceCollection = "attendance";
const employeeCollection = "employees";

type CorrectionReviewer = Pick<
    SessionUser,
    "uid" | "username" | "displayName" | "role"
>;

type StoredCorrectionSnapshot = {
    attendanceRecordId: string;
    attendanceDate: string;
    timeIn: Timestamp | null;
    timeOut: Timestamp | null;
    timeInSource: "QR";
    timeOutSource: "QR" | null;
    status: "present" | "completed";
};

type StoredCorrectionChangedField = {
    field: "timeIn" | "timeOut";
    previousValue: Timestamp | null;
    newValue: Timestamp;
};

type StoredCorrectionReviewer = {
    uid: string;
    username: string;
    displayName: string;
    role: "hr";
};

export type StoredAttendanceCorrectionRequest = {
    id: string;
    attendanceRecordId: string;
    employeeId: string;
    attendanceDate: string;
    issueType: AttendanceCorrectionIssueType;
    status: AttendanceCorrectionStatus;
    reason: string;
    submittedAt: Timestamp;
    submittedBy: {
        displayName: string;
        username: string;
        role: "employee" | "hr";
    };
    originalAttendance: StoredCorrectionSnapshot | null;
    requestedChanges: {
        timeIn?: Timestamp;
        timeOut?: Timestamp;
    };
    resultingAttendance: StoredCorrectionSnapshot | null;
    changedFields: StoredCorrectionChangedField[];
    evidence: Array<{
        id: string;
        fileName: string;
        fileType: string;
        submittedAt: Timestamp;
    }>;
    reviewedBy: StoredCorrectionReviewer | null;
    reviewedAt: Timestamp | null;
    reviewNote: string | null;
    updatedAt: Timestamp | null;
};

export class AttendanceCorrectionError extends Error {
    readonly code: string;
    readonly status: number;

    constructor(code: string, status: number, message: string) {
        super(message);
        this.name = "AttendanceCorrectionError";
        this.code = code;
        this.status = status;
    }
}

export class AttendanceCorrectionDataError extends AttendanceCorrectionError {
    constructor() {
        super(
            "ATTENDANCE_CORRECTION_DATA_INVALID",
            500,
            "The attendance correction request has an invalid shape.",
        );
        this.name = "AttendanceCorrectionDataError";
    }
}

export class AttendanceCorrectionNotFoundError extends AttendanceCorrectionError {
    constructor() {
        super(
            "ATTENDANCE_CORRECTION_NOT_FOUND",
            404,
            "The attendance correction request could not be found.",
        );
        this.name = "AttendanceCorrectionNotFoundError";
    }
}

export class AttendanceCorrectionConflictError extends AttendanceCorrectionError {
    constructor(message: string) {
        super("ATTENDANCE_CORRECTION_CONFLICT", 409, message);
        this.name = "AttendanceCorrectionConflictError";
    }
}

export class AttendanceCorrectionIntegrityError extends AttendanceCorrectionError {
    constructor(message: string) {
        super("ATTENDANCE_CORRECTION_INTEGRITY_ERROR", 409, message);
        this.name = "AttendanceCorrectionIntegrityError";
    }
}

export class AttendanceCorrectionValidationError extends AttendanceCorrectionError {
    constructor(message: string) {
        super("ATTENDANCE_CORRECTION_VALIDATION_ERROR", 400, message);
        this.name = "AttendanceCorrectionValidationError";
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function getRequiredString(
    data: Record<string, unknown>,
    field: string,
): string | null {
    const value = data[field];

    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getTimestamp(value: unknown): Timestamp | null {
    return value instanceof Timestamp ? value : null;
}

function parseStatus(value: unknown): AttendanceCorrectionStatus | null {
    return value === "pending" || value === "approved" || value === "rejected"
        ? value
        : null;
}

function parseIssueType(value: unknown): AttendanceCorrectionIssueType | null {
    if (
        value === "Missing Time-In"
        || value === "Missing Time-Out"
        || value === "Incorrect Time-In"
        || value === "Incorrect Time-Out"
        || value === "Time In and Time Out Correction"
    ) {
        return value;
    }

    return null;
}

function parseSubmittedBy(
    value: unknown,
): StoredAttendanceCorrectionRequest["submittedBy"] | null {
    if (!isRecord(value)) {
        return null;
    }

    const displayName = getRequiredString(value, "displayName");
    const username = getRequiredString(value, "username");
    const role = value.role;

    if (
        !displayName
        || !username
        || (role !== "employee" && role !== "hr")
    ) {
        return null;
    }

    return { displayName, username, role };
}

function parseReviewedBy(
    value: unknown,
): StoredCorrectionReviewer | null {
    if (!isRecord(value)) {
        return null;
    }

    const uid = getRequiredString(value, "uid");
    const username = getRequiredString(value, "username");
    const displayName = getRequiredString(value, "displayName");

    if (!uid || !username || !displayName || value.role !== "hr") {
        return null;
    }

    return {
        uid,
        username,
        displayName,
        role: "hr",
    };
}

function parseSnapshot(value: unknown): StoredCorrectionSnapshot | null {
    if (!isRecord(value)) {
        return null;
    }

    const attendanceRecordId = getRequiredString(value, "attendanceRecordId");
    const attendanceDate = getRequiredString(value, "attendanceDate");
    const timeIn = value.timeIn === null ? null : getTimestamp(value.timeIn);
    const timeOut = value.timeOut === null ? null : getTimestamp(value.timeOut);
    const timeInSource = value.timeInSource;
    const timeOutSource = value.timeOutSource === null
        ? null
        : value.timeOutSource;
    const status = value.status;

    if (
        !attendanceRecordId
        || !attendanceDate
        || (value.timeIn !== null && !timeIn)
        || (value.timeOut !== null && !timeOut)
        || timeInSource !== "QR"
        || (timeOutSource !== null && timeOutSource !== "QR")
        || (status !== "present" && status !== "completed")
    ) {
        return null;
    }

    return {
        attendanceRecordId,
        attendanceDate,
        timeIn,
        timeOut,
        timeInSource,
        timeOutSource,
        status,
    };
}

function parseRequestedChanges(
    value: unknown,
): StoredAttendanceCorrectionRequest["requestedChanges"] | null {
    if (!isRecord(value)) {
        return null;
    }

    const timeIn = value.timeIn === undefined ? undefined : getTimestamp(value.timeIn);
    const timeOut = value.timeOut === undefined ? undefined : getTimestamp(value.timeOut);

    if (value.timeIn !== undefined && !timeIn) {
        return null;
    }

    if (value.timeOut !== undefined && !timeOut) {
        return null;
    }

    if (!timeIn && !timeOut) {
        return null;
    }

    return {
        ...(timeIn ? { timeIn } : {}),
        ...(timeOut ? { timeOut } : {}),
    };
}

function parseEvidence(
    value: unknown,
): StoredAttendanceCorrectionRequest["evidence"] | null {
    if (value === undefined) {
        return [];
    }

    if (!Array.isArray(value)) {
        return null;
    }

    return value.map((item) => {
        if (!isRecord(item)) {
            return null;
        }

        const id = getRequiredString(item, "id");
        const fileName = getRequiredString(item, "fileName");
        const fileType = getRequiredString(item, "fileType");
        const submittedAt = getTimestamp(item.submittedAt);

        return id && fileName && fileType && submittedAt
            ? { id, fileName, fileType, submittedAt }
            : null;
    }).filter(
        (item): item is StoredAttendanceCorrectionRequest["evidence"][number] => item !== null,
    );
}

function parseChangedFields(
    value: unknown,
): StoredCorrectionChangedField[] | null {
    if (value === undefined) {
        return [];
    }

    if (!Array.isArray(value)) {
        return null;
    }

    return value.map((item) => {
        if (!isRecord(item)) {
            return null;
        }

        const field = item.field;
        const previousValue = item.previousValue === null
            ? null
            : getTimestamp(item.previousValue);
        const newValue = getTimestamp(item.newValue);

        return (field === "timeIn" || field === "timeOut")
            && (item.previousValue === null || previousValue)
            && newValue
            ? { field, previousValue, newValue }
            : null;
    }).filter(
        (item): item is StoredCorrectionChangedField => item !== null,
    );
}

export function parseStoredAttendanceCorrectionRequest(
    documentId: string,
    data: DocumentData | undefined,
): StoredAttendanceCorrectionRequest | null {
    if (!data) {
        return null;
    }

    const id = getRequiredString(data, "id");
    const attendanceRecordId = getRequiredString(data, "attendanceRecordId");
    const employeeId = getRequiredString(data, "employeeId");
    const attendanceDate = getRequiredString(data, "attendanceDate");
    const issueType = parseIssueType(data.issueType);
    const status = parseStatus(data.status);
    const reason = getRequiredString(data, "reason");
    const submittedAt = getTimestamp(data.submittedAt);
    const submittedBy = parseSubmittedBy(data.submittedBy);
    const originalAttendance = data.originalAttendance === undefined
        || data.originalAttendance === null
        ? null
        : parseSnapshot(data.originalAttendance);
    const requestedChanges = parseRequestedChanges(data.requestedChanges);
    const resultingAttendance = data.resultingAttendance === undefined
        || data.resultingAttendance === null
        ? null
        : parseSnapshot(data.resultingAttendance);
    const changedFields = parseChangedFields(data.changedFields);
    const evidence = parseEvidence(data.evidence);
    const reviewedBy = data.reviewedBy === undefined || data.reviewedBy === null
        ? null
        : parseReviewedBy(data.reviewedBy);
    const reviewedAt = data.reviewedAt === undefined || data.reviewedAt === null
        ? null
        : getTimestamp(data.reviewedAt);
    const reviewNote = data.reviewNote === undefined || data.reviewNote === null
        ? null
        : getRequiredString(data, "reviewNote");
    const updatedAt = data.updatedAt === undefined || data.updatedAt === null
        ? null
        : getTimestamp(data.updatedAt);

    if (
        !id
        || id !== documentId
        || !attendanceRecordId
        || !employeeId
        || !attendanceDate
        || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)
        || !issueType
        || !status
        || !reason
        || !submittedAt
        || !submittedBy
        || !requestedChanges
        || (data.originalAttendance !== undefined
            && data.originalAttendance !== null
            && !originalAttendance)
        || (data.resultingAttendance !== undefined
            && data.resultingAttendance !== null
            && !resultingAttendance)
        || !changedFields
        || !evidence
        || (data.reviewedBy !== undefined
            && data.reviewedBy !== null
            && !reviewedBy)
        || (data.reviewedAt !== undefined
            && data.reviewedAt !== null
            && !reviewedAt)
        || (data.updatedAt !== undefined
            && data.updatedAt !== null
            && !updatedAt)
        || (status === "pending" && (reviewedBy || reviewedAt))
        || (status !== "pending" && (!reviewedBy || !reviewedAt))
    ) {
        return null;
    }

    return {
        id,
        attendanceRecordId,
        employeeId,
        attendanceDate,
        issueType,
        status,
        reason,
        submittedAt,
        submittedBy,
        originalAttendance,
        requestedChanges,
        resultingAttendance,
        changedFields,
        evidence,
        reviewedBy,
        reviewedAt,
        reviewNote,
        updatedAt,
    };
}

function toStoredSnapshot(
    attendanceRecordId: string,
    record: StoredQrAttendanceRecord,
): StoredCorrectionSnapshot {
    return {
        attendanceRecordId,
        attendanceDate: record.attendanceDate,
        timeIn: record.timeIn,
        timeOut: record.timeOut,
        timeInSource: record.timeInSource,
        timeOutSource: record.timeOutSource,
        status: record.status,
    };
}

function snapshotsMatch(
    left: StoredCorrectionSnapshot,
    right: StoredCorrectionSnapshot,
): boolean {
    return left.attendanceRecordId === right.attendanceRecordId
        && left.attendanceDate === right.attendanceDate
        && left.timeIn?.toMillis() === right.timeIn?.toMillis()
        && left.timeOut?.toMillis() === right.timeOut?.toMillis()
        && left.timeInSource === right.timeInSource
        && left.timeOutSource === right.timeOutSource
        && left.status === right.status;
}

function toReviewerSnapshot(
    reviewer: CorrectionReviewer,
): StoredCorrectionReviewer {
    return {
        uid: reviewer.uid,
        username: reviewer.username,
        displayName: reviewer.displayName,
        role: "hr",
    };
}

function getChangedFields(
    currentRecord: StoredQrAttendanceRecord,
    requestedChanges: StoredAttendanceCorrectionRequest["requestedChanges"],
): StoredCorrectionChangedField[] {
    const changedFields: StoredCorrectionChangedField[] = [];

    if (
        requestedChanges.timeIn
        && requestedChanges.timeIn.toMillis() !== currentRecord.timeIn.toMillis()
    ) {
        changedFields.push({
            field: "timeIn",
            previousValue: currentRecord.timeIn,
            newValue: requestedChanges.timeIn,
        });
    }

    if (
        requestedChanges.timeOut
        && requestedChanges.timeOut.toMillis() !== currentRecord.timeOut?.toMillis()
    ) {
        changedFields.push({
            field: "timeOut",
            previousValue: currentRecord.timeOut,
            newValue: requestedChanges.timeOut,
        });
    }

    return changedFields;
}

function toSerializableSnapshot(
    recordId: string,
    attendanceDate: string,
    timeIn: Timestamp,
    timeOut: Timestamp | null,
    timeInSource: "QR",
    timeOutSource: "QR" | null,
): StoredCorrectionSnapshot {
    return {
        attendanceRecordId: recordId,
        attendanceDate,
        timeIn,
        timeOut,
        timeInSource,
        timeOutSource,
        status: timeOut ? "completed" : "present",
    };
}

export async function getAttendanceCorrectionRequestById(
    requestId: string,
): Promise<StoredAttendanceCorrectionRequest | null> {
    const snapshot = await getFirebaseAdminDb()
        .collection(correctionCollection)
        .doc(requestId)
        .get();

    if (!snapshot.exists) {
        return null;
    }

    const request = parseStoredAttendanceCorrectionRequest(
        snapshot.id,
        snapshot.data(),
    );

    if (!request) {
        throw new AttendanceCorrectionDataError();
    }

    return request;
}

export async function listAttendanceCorrectionRequests(): Promise<
    StoredAttendanceCorrectionRequest[]
> {
    const snapshots = await getFirebaseAdminDb()
        .collection(correctionCollection)
        .get();

    return snapshots.docs
        .map((snapshot) => {
            const request = parseStoredAttendanceCorrectionRequest(
                snapshot.id,
                snapshot.data(),
            );

            if (!request) {
                throw new AttendanceCorrectionDataError();
            }

            return request;
        })
        .sort((left, right) => right.submittedAt.toMillis() - left.submittedAt.toMillis());
}

export async function applyAttendanceCorrectionDecision(
    input: {
        requestId: string;
        decision: AttendanceCorrectionDecision;
        reviewNote: string | null;
        reviewer: CorrectionReviewer;
    },
): Promise<void> {
    const db = getFirebaseAdminDb();
    const requestReference = db
        .collection(correctionCollection)
        .doc(input.requestId);
    const reviewer = toReviewerSnapshot(input.reviewer);

    await db.runTransaction(async (transaction) => {
        const requestSnapshot = await transaction.get(requestReference);

        if (!requestSnapshot.exists) {
            throw new AttendanceCorrectionNotFoundError();
        }

        const request = parseStoredAttendanceCorrectionRequest(
            requestSnapshot.id,
            requestSnapshot.data(),
        );

        if (!request) {
            throw new AttendanceCorrectionDataError();
        }

        if (request.status !== "pending") {
            throw new AttendanceCorrectionConflictError(
                `This correction request is already ${request.status}. Refresh the request before trying again.`,
            );
        }

        const attendanceReference = db
            .collection(attendanceCollection)
            .doc(request.attendanceRecordId);
        const employeeReference = db
            .collection(employeeCollection)
            .doc(request.employeeId);
        const attendanceSnapshot = await transaction.get(attendanceReference);
        const employeeSnapshot = await transaction.get(employeeReference);
        const attendanceRecord = attendanceSnapshot.exists
            ? parseStoredQrAttendanceRecord(attendanceSnapshot.data())
            : null;

        if (!employeeSnapshot.exists) {
            throw new AttendanceCorrectionIntegrityError(
                "The employee reference for this correction request is unavailable.",
            );
        }

        if (attendanceSnapshot.exists && !attendanceRecord) {
            throw new AttendanceCorrectionIntegrityError(
                "The linked attendance record has an invalid shape.",
            );
        }

        if (
            attendanceRecord
            && (
                attendanceRecord.employeeId !== request.employeeId
                || request.attendanceRecordId !== attendanceSnapshot.id
                || attendanceRecord.attendanceDate !== request.attendanceDate
            )
        ) {
            throw new AttendanceCorrectionIntegrityError(
                "The correction request does not match its linked attendance record.",
            );
        }

        const currentSnapshot = attendanceRecord
            ? toStoredSnapshot(request.attendanceRecordId, attendanceRecord)
            : null;
        const originalSnapshot = request.originalAttendance ?? currentSnapshot;

        if (
            input.decision === "approve"
            && !attendanceRecord
        ) {
            throw new AttendanceCorrectionIntegrityError(
                "The linked attendance record is unavailable, so this correction cannot be approved.",
            );
        }

        if (
            input.decision === "approve"
            && attendanceRecord
            && request.originalAttendance
            && !snapshotsMatch(request.originalAttendance, currentSnapshot as StoredCorrectionSnapshot)
        ) {
            throw new AttendanceCorrectionConflictError(
                "Attendance has changed since this correction request was submitted. Review the current attendance before making a decision.",
            );
        }

        if (input.decision === "reject") {
            transaction.update(requestReference, {
                status: "rejected",
                reviewedBy: reviewer,
                reviewedAt: FieldValue.serverTimestamp(),
                decision: "rejected",
                reviewNote: input.reviewNote,
                originalAttendance: originalSnapshot,
                updatedAt: FieldValue.serverTimestamp(),
            });

            return;
        }

        if (!attendanceRecord) {
            throw new AttendanceCorrectionIntegrityError(
                "The linked attendance record is unavailable, so this correction cannot be approved.",
            );
        }

        const nextTimeIn = request.requestedChanges.timeIn ?? attendanceRecord.timeIn;
        const nextTimeOut = request.requestedChanges.timeOut ?? attendanceRecord.timeOut;

        if (
            nextTimeOut
            && nextTimeIn
            && nextTimeOut.toMillis() < nextTimeIn.toMillis()
        ) {
            throw new AttendanceCorrectionValidationError(
                "The requested attendance times are not in a valid order.",
            );
        }

        const changedFields = getChangedFields(
            attendanceRecord,
            request.requestedChanges,
        );
        const resultingAttendance = toSerializableSnapshot(
            request.attendanceRecordId,
            attendanceRecord.attendanceDate,
            nextTimeIn,
            nextTimeOut,
            attendanceRecord.timeInSource,
            attendanceRecord.timeOutSource,
        );

        const attendanceUpdate: DocumentData = {
            status: resultingAttendance.status,
            correction: {
                requestId: request.id,
                correctedAt: FieldValue.serverTimestamp(),
                correctedBy: reviewer,
            },
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (request.requestedChanges.timeIn) {
            attendanceUpdate.timeIn = request.requestedChanges.timeIn;
        }

        if (request.requestedChanges.timeOut) {
            attendanceUpdate.timeOut = request.requestedChanges.timeOut;
        }

        transaction.update(attendanceReference, attendanceUpdate);
        transaction.update(requestReference, {
            status: "approved",
            reviewedBy: reviewer,
            reviewedAt: FieldValue.serverTimestamp(),
            decision: "approved",
            reviewNote: input.reviewNote,
            originalAttendance: originalSnapshot,
            resultingAttendance,
            changedFields,
            updatedAt: FieldValue.serverTimestamp(),
        });
    });
}
