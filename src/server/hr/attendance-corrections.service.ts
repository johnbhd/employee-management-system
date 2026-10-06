import "server-only";

import {
    formatCampusDateKey,
    formatCampusDateKeyLabel,
    formatCampusDateTime,
    formatCampusTime,
} from "@/lib/campus-time";
import {
    getAttendanceByRecordId,
} from "@/server/repositories/attendance/attendance.repository";
import {
    applyAttendanceCorrectionDecision,
    listAttendanceCorrectionRequests,
    AttendanceCorrectionValidationError,
    type StoredAttendanceCorrectionRequest,
} from "@/server/repositories/attendance-corrections/attendance-correction.repository";
import type { SessionUser } from "@/types/auth";
import { listEmployees } from "@/server/repositories/employees/employee.repository";
import type {
    AttendanceCorrectionDecision,
    AttendanceCorrectionAttendance,
    AttendanceCorrectionData,
    AttendanceCorrectionHistoryItem,
    AttendanceCorrectionRecord,
    AttendanceCorrectionRequestedChanges,
} from "@/types/attendance-correction";

export async function reviewAttendanceCorrection(input: {
    requestId: string;
    decision: AttendanceCorrectionDecision;
    reviewNote: string | null;
    reviewer: Pick<SessionUser, "uid" | "username" | "displayName" | "role">;
}): Promise<void> {
    const reviewNote = input.reviewNote?.trim() || null;

    if (reviewNote && reviewNote.length > 1000) {
        throw new AttendanceCorrectionValidationError(
            "The review note is too long.",
        );
    }

    await applyAttendanceCorrectionDecision({
        ...input,
        reviewNote,
    });
}

function statusTone(status: AttendanceCorrectionRecord["status"]) {
    if (status === "approved") return "success" as const;
    if (status === "rejected") return "danger" as const;
    return "info" as const;
}

function statusLabel(status: AttendanceCorrectionRecord["status"]) {
    if (status === "approved") return "Approved" as const;
    if (status === "rejected") return "Rejected" as const;
    return "Pending" as const;
}

function toAttendanceDto(
    snapshot: {
        attendanceRecordId: string;
        attendanceDate: string;
        timeIn: { toDate(): Date } | null;
        timeOut: { toDate(): Date } | null;
        timeInSource: "QR";
        timeOutSource: "QR" | null;
        status: "present" | "completed";
    } | null,
): AttendanceCorrectionAttendance | null {
    if (!snapshot) return null;

    return {
        attendanceRecordId: snapshot.attendanceRecordId,
        attendanceDate: snapshot.attendanceDate,
        timeIn: snapshot.timeIn ? formatCampusTime(snapshot.timeIn.toDate()) : null,
        timeOut: snapshot.timeOut ? formatCampusTime(snapshot.timeOut.toDate()) : null,
        timeInSource: snapshot.timeInSource,
        timeOutSource: snapshot.timeOutSource,
        status: snapshot.status,
    };
}

function toRequestedChangesDto(
    request: StoredAttendanceCorrectionRequest,
): AttendanceCorrectionRequestedChanges {
    return {
        ...(request.requestedChanges.timeIn
            ? { timeIn: formatCampusTime(request.requestedChanges.timeIn.toDate()) }
            : {}),
        ...(request.requestedChanges.timeOut
            ? { timeOut: formatCampusTime(request.requestedChanges.timeOut.toDate()) }
            : {}),
    };
}

function toChangedFieldsDto(request: StoredAttendanceCorrectionRequest) {
    return request.changedFields.map((field) => ({
        field: field.field,
        previousValue: field.previousValue
            ? formatCampusTime(field.previousValue.toDate())
            : null,
        newValue: formatCampusTime(field.newValue.toDate()),
    }));
}

function toHistory(
    request: StoredAttendanceCorrectionRequest,
): AttendanceCorrectionHistoryItem[] {
    const history: AttendanceCorrectionHistoryItem[] = [
        {
            id: `${request.id}-submitted`,
            action: "Request submitted",
            actor: request.submittedBy.displayName,
            actorRole: request.submittedBy.role === "employee"
                ? "Employee"
                : "HR / Attendance Staff",
            occurredAt: formatCampusDateTime(request.submittedAt.toDate()),
        },
    ];

    if (request.reviewedBy && request.reviewedAt) {
        history.push({
            id: `${request.id}-${request.status}`,
            action: request.status === "approved"
                ? "Correction approved"
                : "Correction rejected",
            actor: request.reviewedBy.displayName,
            actorRole: "HR / Attendance Staff",
            occurredAt: formatCampusDateTime(request.reviewedAt.toDate()),
            ...(request.reviewNote ? { note: request.reviewNote } : {}),
        });
    }

    return history;
}

async function toCorrectionRecord(
    request: StoredAttendanceCorrectionRequest,
    employeeById: ReadonlyMap<string, Awaited<ReturnType<typeof listEmployees>>[number]>,
): Promise<AttendanceCorrectionRecord> {
    const [currentAttendance] = await Promise.all([
        getAttendanceByRecordId(request.attendanceRecordId),
    ]);
    const employee = employeeById.get(request.employeeId) ?? null;
    const originalAttendance = request.originalAttendance
        ? toAttendanceDto(request.originalAttendance)
        : null;
    const resultingAttendance = request.status === "approved"
        ? toAttendanceDto(currentAttendance
            ? {
                attendanceRecordId: request.attendanceRecordId,
                attendanceDate: currentAttendance.attendanceDate,
                timeIn: currentAttendance.timeIn,
                timeOut: currentAttendance.timeOut,
                timeInSource: currentAttendance.timeInSource,
                timeOutSource: currentAttendance.timeOutSource,
                status: currentAttendance.status,
            }
            : null)
        : null;

    return {
        id: request.id,
        attendanceRecordId: request.attendanceRecordId,
        employeeId: request.employeeId,
        employee,
        attendanceDate: request.attendanceDate,
        attendanceDateLabel: formatCampusDateKeyLabel(request.attendanceDate, "long"),
        submittedDate: formatCampusDateKey(request.submittedAt.toDate()),
        submittedAt: formatCampusDateTime(request.submittedAt.toDate()),
        issueType: request.issueType,
        status: request.status,
        statusLabel: statusLabel(request.status),
        statusTone: statusTone(request.status),
        reason: request.reason,
        currentAttendance: toAttendanceDto(currentAttendance
            ? {
                attendanceRecordId: request.attendanceRecordId,
                attendanceDate: currentAttendance.attendanceDate,
                timeIn: currentAttendance.timeIn,
                timeOut: currentAttendance.timeOut,
                timeInSource: currentAttendance.timeInSource,
                timeOutSource: currentAttendance.timeOutSource,
                status: currentAttendance.status,
            }
            : null),
        originalAttendance,
        requestedChanges: toRequestedChangesDto(request),
        resultingAttendance,
        changedFields: toChangedFieldsDto(request),
        evidence: request.evidence.map((item) => ({
            id: item.id,
            fileName: item.fileName,
            fileType: item.fileType,
            submittedAt: formatCampusDateTime(item.submittedAt.toDate()),
        })),
        history: toHistory(request),
        reviewedBy: request.reviewedBy
            ? {
                displayName: request.reviewedBy.displayName,
                username: request.reviewedBy.username,
                role: "hr",
            }
            : null,
        reviewedAt: request.reviewedAt
            ? formatCampusDateTime(request.reviewedAt.toDate())
            : null,
        reviewNote: request.reviewNote,
    };
}

export async function getAttendanceCorrectionsData(): Promise<AttendanceCorrectionData> {
    const [requests, employees] = await Promise.all([
        listAttendanceCorrectionRequests(),
        listEmployees(),
    ]);
    const employeeById = new Map(
        employees.map((employee) => [employee.employeeId, employee]),
    );
    const records = await Promise.all(
        requests.map((request) => toCorrectionRecord(request, employeeById)),
    );

    return {
        records,
        summary: {
            pending: records.filter((record) => record.status === "pending").length,
            approved: records.filter((record) => record.status === "approved").length,
            rejected: records.filter((record) => record.status === "rejected").length,
        },
        departments: Array.from(
            new Set(
                records
                    .map((record) => record.employee?.department)
                    .filter((department): department is string => Boolean(department)),
            ),
        ).sort(),
    };
}
