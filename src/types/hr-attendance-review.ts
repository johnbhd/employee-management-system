import type { StatusTone } from "@/types/ui";

export type HrReviewTechnicalState =
    | "NO_EVENTS"
    | "IN_PROGRESS"
    | "COMPLETE"
    | "MISSING_IN"
    | "MISSING_OUT"
    | "NEEDS_REVIEW";

export type HrReviewBusinessStatus =
    | "UNCLASSIFIED"
    | "PRESENT"
    | "LATE"
    | "ABSENT";

export type HrReviewCorrectionStatus = "pending" | "approved" | "rejected";

export type HrReviewVerificationStatus = "pending" | "verified";

export type HrReviewEvidence = {
    id: string;
    source: "BUNDY" | "QR";
    direction: "IN" | "OUT";
    occurredAt: string;
    reference: string;
};

export type HrReviewSchedule = {
    scheduleId: string;
    shiftLabel: string | null;
    workStart: string | null;
    workEnd: string | null;
    workDays: string[];
};

export type HrReviewAttendanceValues = {
    timeIn: string | null;
    timeOut: string | null;
};

export type HrReviewCorrection = {
    id: string;
    issueType: string;
    status: HrReviewCorrectionStatus;
    reason: string;
    remarks: string | null;
    requested: HrReviewAttendanceValues;
    original: HrReviewAttendanceValues;
    resulting: HrReviewAttendanceValues | null;
    submittedBy: string;
    submittedAt: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
    reviewNote: string | null;
};

export type HrAttendanceReviewRecord = {
    id: string;
    employee: {
        employeeId: string;
        displayName: string;
        department: string;
        position: string | null;
    };
    attendanceDate: string;
    attendanceDateLabel: string;
    schedule: HrReviewSchedule | null;
    original: HrReviewAttendanceValues & {
        timeInSource: "BUNDY" | "QR" | null;
        timeOutSource: "BUNDY" | "QR" | null;
        technicalState: HrReviewTechnicalState;
        businessStatus: HrReviewBusinessStatus;
        requiresReview: boolean;
        reviewReasonCode: string | null;
    };
    effective: HrReviewAttendanceValues;
    verification: {
        status: HrReviewVerificationStatus;
        verifiedAt: string | null;
        verifiedBy: string | null;
    };
    evidence: HrReviewEvidence[];
    corrections: HrReviewCorrection[];
};

export type HrAttendanceReviewSummary = {
    needsReview: number;
    missingIn: number;
    missingOut: number;
    pendingCorrections: number;
    readyForVerification: number;
    finalVerified: number;
};

export type HrAttendanceReviewData = {
    records: HrAttendanceReviewRecord[];
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    summary: HrAttendanceReviewSummary;
    employees: Array<{
        employeeId: string;
        displayName: string;
    }>;
    departments: string[];
    permissions: {
        canReviewCorrections: boolean;
        canVerifyAttendance: boolean;
    };
};

export type HrReviewStatusPresentation = {
    label: string;
    tone: StatusTone;
};
