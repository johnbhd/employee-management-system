import type {
    HrReviewBusinessStatus,
    HrReviewCorrectionStatus,
    HrReviewTechnicalState,
    HrReviewVerificationStatus,
} from "@/types/hr-attendance-review";

export const hrAttendanceReviewPageSizes = [25, 50, 100] as const;
export const defaultHrAttendanceReviewPageSize = 25;

export type HrAttendanceReviewQuery = {
    search: string;
    employeeId: string | null;
    department: string | null;
    fromDate: string | null;
    toDate: string | null;
    technicalState: HrReviewTechnicalState | null;
    businessStatus: HrReviewBusinessStatus | null;
    reviewState: "needs-review" | "all";
    correctionStatus: HrReviewCorrectionStatus | null;
    verificationStatus: HrReviewVerificationStatus | null;
    page: number;
    pageSize: number;
};

const technicalStates: HrReviewTechnicalState[] = [
    "NO_EVENTS",
    "IN_PROGRESS",
    "COMPLETE",
    "MISSING_IN",
    "MISSING_OUT",
    "NEEDS_REVIEW",
];

const businessStatuses: HrReviewBusinessStatus[] = [
    "UNCLASSIFIED",
    "PRESENT",
    "LATE",
    "ABSENT",
];

function value(params: URLSearchParams, key: string, maxLength = 128) {
    const raw = params.get(key)?.trim() ?? "";
    return raw.length > maxLength ? raw.slice(0, maxLength) : raw;
}

function dateValue(params: URLSearchParams, key: string) {
    const raw = value(params, key, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function pageValue(params: URLSearchParams) {
    const parsed = Number.parseInt(params.get("page") ?? "1", 10);
    return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 1000) : 1;
}

function pageSizeValue(params: URLSearchParams) {
    const parsed = Number.parseInt(
        params.get("pageSize") ?? String(defaultHrAttendanceReviewPageSize),
        10,
    );

    return hrAttendanceReviewPageSizes.includes(
        parsed as (typeof hrAttendanceReviewPageSizes)[number],
    )
        ? parsed as (typeof hrAttendanceReviewPageSizes)[number]
        : defaultHrAttendanceReviewPageSize;
}

export function parseHrAttendanceReviewQuery(
    params: URLSearchParams,
): HrAttendanceReviewQuery {
    const technicalState = value(params, "technicalState");
    const businessStatus = value(params, "businessStatus");
    const correctionStatus = value(params, "correctionStatus");
    const verificationStatus = value(params, "verificationStatus");

    return {
        search: value(params, "search"),
        employeeId: value(params, "employeeId", 64) || null,
        department: value(params, "department") || null,
        fromDate: dateValue(params, "fromDate"),
        toDate: dateValue(params, "toDate"),
        technicalState: technicalStates.includes(technicalState as HrReviewTechnicalState)
            ? technicalState as HrReviewTechnicalState
            : null,
        businessStatus: businessStatuses.includes(businessStatus as HrReviewBusinessStatus)
            ? businessStatus as HrReviewBusinessStatus
            : null,
        reviewState: value(params, "reviewState") === "all" ? "all" : "needs-review",
        correctionStatus: correctionStatus === "pending"
            || correctionStatus === "approved"
            || correctionStatus === "rejected"
            ? correctionStatus
            : null,
        verificationStatus: verificationStatus === "pending"
            || verificationStatus === "verified"
            ? verificationStatus
            : null,
        page: pageValue(params),
        pageSize: pageSizeValue(params),
    };
}
