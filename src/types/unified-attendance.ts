import type { Prisma } from "@prisma/client";

export type UnifiedAttendanceTechnicalState =
    | "NO_EVENTS"
    | "IN_PROGRESS"
    | "COMPLETE"
    | "MISSING_IN"
    | "MISSING_OUT"
    | "NEEDS_REVIEW";

export type UnifiedAttendanceBusinessStatus =
    | "UNCLASSIFIED"
    | "PRESENT"
    | "LATE"
    | "ABSENT";

export type UnifiedAttendanceScheduleSnapshot = {
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
};

export type UnifiedAttendanceListFilters = {
    attendanceDate?: string | null;
    fromDate?: string | null;
    toDate?: string | null;
    employeeId?: string | null;
    search?: string | null;
    department?: string | null;
    technicalState?: UnifiedAttendanceTechnicalState | null;
    businessStatus?: UnifiedAttendanceBusinessStatus | null;
    requiresReview?: boolean | null;
    page?: number;
    pageSize?: number;
};

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
    firstInSource: "BUNDY" | "QR" | null;
    lastOutSource: "BUNDY" | "QR" | null;
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
    sourceMetadata: Prisma.JsonValue | null;
    requiresReview: boolean;
    reviewReasonCode: string | null;
    processedAt: string | null;
    processingVersion: string | null;
    lastReprocessedAt: string | null;
    bundyEvidence: UnifiedAttendanceEvidence[];
    createdAt: string;
    updatedAt: string;
};
