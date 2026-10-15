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
    technicalState?: UnifiedAttendanceTechnicalState | null;
    businessStatus?: UnifiedAttendanceBusinessStatus | null;
    requiresReview?: boolean | null;
    page?: number;
    pageSize?: number;
};
