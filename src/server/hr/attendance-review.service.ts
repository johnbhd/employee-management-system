import "server-only";

import type { AttendanceCorrectionIssueType } from "@prisma/client";

import { formatCampusDateKey } from "@/lib/campus-time";
import {
    createHrAttendanceCorrection,
    finalVerifyHrAttendance,
    getHrAttendanceReviewRecord,
    HrAttendanceReviewRepositoryError,
    listHrAttendanceReviewData,
} from "@/server/repositories/attendance/hr-attendance-review.repository";
import { recordAuditEvent } from "@/server/repositories/audit/audit.repository";
import type { SessionUser } from "@/types/auth";
import type { HrAttendanceReviewData } from "@/types/hr-attendance-review";
import type { HrAttendanceReviewQuery } from "./attendance-review-query";

const issueTypes: Record<string, AttendanceCorrectionIssueType> = {
    "Missing Time-In": "MissingTimeIn",
    "Missing Time-Out": "MissingTimeOut",
    "Incorrect Time-In": "IncorrectTimeIn",
    "Incorrect Time-Out": "IncorrectTimeOut",
    "Time In and Time Out Correction": "TimeInAndTimeOutCorrection",
};

type HrAttendanceActor = Pick<
    SessionUser,
    "uid" | "username" | "displayName" | "role"
>;

export class HrAttendanceReviewError extends Error {
    readonly code: string;
    readonly status: 400 | 404 | 409 | 500;

    constructor(code: string, message: string, status: 400 | 404 | 409 | 500 = 400) {
        super(message);
        this.name = "HrAttendanceReviewError";
        this.code = code;
        this.status = status;
    }
}

function requiredText(value: unknown, field: string, maxLength: number) {
    if (typeof value !== "string" || !value.trim()) {
        throw new HrAttendanceReviewError(
            "HR_ATTENDANCE_VALIDATION_ERROR",
            `${field} is required.`,
        );
    }

    const result = value.trim();
    if (result.length > maxLength) {
        throw new HrAttendanceReviewError(
            "HR_ATTENDANCE_VALIDATION_ERROR",
            `${field} must be ${maxLength} characters or fewer.`,
        );
    }

    return result;
}

function optionalText(value: unknown, field: string, maxLength: number) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    return requiredText(value, field, maxLength);
}

function parseCampusTimestamp(value: unknown, field: string, attendanceDate: string) {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new HrAttendanceReviewError(
            "HR_ATTENDANCE_VALIDATION_ERROR",
            `${field} must be a valid date and time.`,
        );
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || formatCampusDateKey(date) !== attendanceDate) {
        throw new HrAttendanceReviewError(
            "HR_ATTENDANCE_VALIDATION_ERROR",
            `${field} must fall on the attendance date in the campus timezone.`,
        );
    }

    return date;
}

function issueType(value: unknown) {
    if (typeof value !== "string" || !issueTypes[value]) {
        throw new HrAttendanceReviewError(
            "HR_ATTENDANCE_VALIDATION_ERROR",
            "Choose a valid correction reason type.",
        );
    }

    return issueTypes[value];
}

function actorSnapshot(actor: HrAttendanceActor) {
    return {
        uid: actor.uid,
        username: actor.username,
        displayName: actor.displayName,
        role: actor.role,
    };
}

export async function getHrAttendanceReviewData(
    query: HrAttendanceReviewQuery,
    permissions: HrAttendanceReviewData["permissions"],
) {
    return listHrAttendanceReviewData(query, permissions);
}

export async function createAttendanceReviewCorrection(input: {
    attendanceRecordId: string;
    payload: Record<string, unknown>;
    actor: HrAttendanceActor;
}) {
    const record = await getHrAttendanceReviewRecord(input.attendanceRecordId);
    if (!record) {
        throw new HrAttendanceReviewError(
            "HR_ATTENDANCE_NOT_FOUND",
            "The attendance record could not be found.",
            404,
        );
    }

    if (record.verification.status === "verified") {
        throw new HrAttendanceReviewError(
            "ATTENDANCE_FINAL_VERIFIED",
            "Final-verified attendance cannot receive a new correction.",
            409,
        );
    }

    const correctedTimeIn = parseCampusTimestamp(
        input.payload.correctedTimeIn,
        "Corrected Time-In",
        record.attendanceDate,
    );
    const correctedTimeOut = parseCampusTimestamp(
        input.payload.correctedTimeOut,
        "Corrected Time-Out",
        record.attendanceDate,
    );

    if (!correctedTimeIn && !correctedTimeOut) {
        throw new HrAttendanceReviewError(
            "HR_ATTENDANCE_VALIDATION_ERROR",
            "Provide at least one corrected attendance time.",
        );
    }

    const effectiveTimeIn = correctedTimeIn ?? (
        record.effective.timeIn ? new Date(record.effective.timeIn) : null
    );
    const effectiveTimeOut = correctedTimeOut ?? (
        record.effective.timeOut ? new Date(record.effective.timeOut) : null
    );

    if (effectiveTimeIn && effectiveTimeOut && effectiveTimeOut <= effectiveTimeIn) {
        throw new HrAttendanceReviewError(
            "HR_ATTENDANCE_VALIDATION_ERROR",
            "Corrected Time-Out must be later than Corrected Time-In.",
        );
    }

    if (
        correctedTimeIn?.getTime() === (record.original.timeIn ? new Date(record.original.timeIn).getTime() : null)
        && correctedTimeOut?.getTime() === (record.original.timeOut ? new Date(record.original.timeOut).getTime() : null)
    ) {
        throw new HrAttendanceReviewError(
            "HR_ATTENDANCE_VALIDATION_ERROR",
            "The correction must change at least one attendance value.",
        );
    }

    const reason = requiredText(input.payload.reason, "Reason", 500);
    const remarks = optionalText(input.payload.remarks, "Remarks", 1000);
    const created = await createHrAttendanceCorrection({
        attendanceRecordId: record.id,
        issueType: issueType(input.payload.issueType),
        reason,
        remarks,
        requestedChanges: {
            ...(correctedTimeIn ? { timeIn: correctedTimeIn } : {}),
            ...(correctedTimeOut ? { timeOut: correctedTimeOut } : {}),
        },
        submittedBy: actorSnapshot(input.actor),
        evidence: record.evidence,
    });

    await recordAuditEvent({
        id: `${created.id}:created`,
        eventType: "hr.attendance.correction.created",
        action: "ATTENDANCE_CORRECTION_CREATED",
        module: "HR Attendance Review",
        actor: {
            type: "user",
            uid: input.actor.uid,
            displayName: input.actor.displayName,
            role: input.actor.role,
        },
        target: {
            type: "attendance_correction",
            id: created.id,
            reference: record.id,
            label: `${record.employee.employeeId} · ${record.attendanceDate}`,
        },
        outcome: "Successful",
        summary: "An HR attendance correction was created.",
        metadata: {
            attendanceRecordId: record.id,
            employeeId: record.employee.employeeId,
            attendanceDate: record.attendanceDate,
        },
    });

    return created;
}

export async function finalVerifyAttendanceReview(input: {
    attendanceRecordId: string;
    actor: HrAttendanceActor;
}) {
    const result = await finalVerifyHrAttendance({
        attendanceRecordId: input.attendanceRecordId,
        verifier: actorSnapshot(input.actor),
    });

    if (!result.alreadyVerified) {
        await recordAuditEvent({
            id: `${result.id}:final-verified`,
            eventType: "hr.attendance.final_verified",
            action: "ATTENDANCE_FINAL_VERIFIED",
            module: "HR Attendance Review",
            actor: {
                type: "user",
                uid: input.actor.uid,
                displayName: input.actor.displayName,
                role: input.actor.role,
            },
            target: {
                type: "attendance_record",
                id: result.id,
                reference: result.id,
                label: `${result.employeeId} · ${result.attendanceDate}`,
            },
            outcome: "Successful",
            summary: "HR final-verified an attendance record for payroll readiness.",
            metadata: {
                attendanceRecordId: result.id,
                employeeId: result.employeeId,
                attendanceDate: result.attendanceDate,
                effectiveTimeIn: result.effectiveTimeIn,
                effectiveTimeOut: result.effectiveTimeOut,
            },
        });
    }

    return result;
}

export function mapHrAttendanceReviewError(error: unknown) {
    if (error instanceof HrAttendanceReviewError) {
        return error;
    }
    if (error instanceof HrAttendanceReviewRepositoryError) {
        return new HrAttendanceReviewError(error.code, error.message, error.status);
    }

    return new HrAttendanceReviewError(
        "HR_ATTENDANCE_REVIEW_UNAVAILABLE",
        "The HR attendance review service is temporarily unavailable.",
        500,
    );
}
