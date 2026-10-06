import type { EmployeeReference } from "@/types/employee";
import type { StatusTone } from "@/types/ui";

export type AttendanceCorrectionStatus = "pending" | "approved" | "rejected";

export type AttendanceCorrectionDecision = "approve" | "reject";

export type AttendanceCorrectionIssueType =
    | "Missing Time-In"
    | "Missing Time-Out"
    | "Incorrect Time-In"
    | "Incorrect Time-Out"
    | "Time In and Time Out Correction";

export type AttendanceCorrectionEvidence = {
    id: string;
    fileName: string;
    fileType: string;
    submittedAt: string;
};

export type AttendanceCorrectionHistoryItem = {
    id: string;
    action: "Request submitted" | "Correction approved" | "Correction rejected";
    actor: string;
    actorRole: string;
    occurredAt: string;
    note?: string;
};

export type AttendanceCorrectionAttendance = {
    attendanceRecordId: string;
    attendanceDate: string;
    timeIn: string | null;
    timeOut: string | null;
    timeInSource: "QR";
    timeOutSource: "QR" | null;
    status: "present" | "completed";
};

export type AttendanceCorrectionRequestedChanges = {
    timeIn?: string;
    timeOut?: string;
};

export type AttendanceCorrectionChangedField = {
    field: "timeIn" | "timeOut";
    previousValue: string | null;
    newValue: string;
};

export type AttendanceCorrectionReviewer = {
    displayName: string;
    username: string;
    role: "hr";
};

export type AttendanceCorrectionRecord = {
    id: string;
    attendanceRecordId: string;
    employeeId: string;
    employee: EmployeeReference | null;
    attendanceDate: string;
    attendanceDateLabel: string;
    submittedDate: string;
    submittedAt: string;
    issueType: AttendanceCorrectionIssueType;
    status: AttendanceCorrectionStatus;
    statusLabel: "Pending" | "Approved" | "Rejected";
    statusTone: StatusTone;
    reason: string;
    currentAttendance: AttendanceCorrectionAttendance | null;
    originalAttendance: AttendanceCorrectionAttendance | null;
    requestedChanges: AttendanceCorrectionRequestedChanges;
    resultingAttendance: AttendanceCorrectionAttendance | null;
    changedFields: readonly AttendanceCorrectionChangedField[];
    evidence: readonly AttendanceCorrectionEvidence[];
    history: readonly AttendanceCorrectionHistoryItem[];
    reviewedBy: AttendanceCorrectionReviewer | null;
    reviewedAt: string | null;
    reviewNote: string | null;
};

export type AttendanceCorrectionData = {
    records: AttendanceCorrectionRecord[];
    summary: {
        pending: number;
        approved: number;
        rejected: number;
    };
    departments: string[];
};
