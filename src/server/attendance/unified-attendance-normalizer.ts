import type { AttendanceSource } from "@prisma/client";

export type NormalizedAttendanceEvidence = {
    sourceRecordId: string;
    source: AttendanceSource;
    timestamp: Date;
    direction: "IN" | "OUT";
    sourceReference: string;
};

export type UnifiedAttendanceNormalization = {
    evidence: NormalizedAttendanceEvidence[];
    firstIn: NormalizedAttendanceEvidence | null;
    lastOut: NormalizedAttendanceEvidence | null;
    technicalState:
        | "NO_EVENTS"
        | "COMPLETE"
        | "MISSING_IN"
        | "MISSING_OUT"
        | "NEEDS_REVIEW";
    requiresReview: boolean;
    reviewReasons: string[];
};

function compareEvidence(
    left: NormalizedAttendanceEvidence,
    right: NormalizedAttendanceEvidence,
) {
    return left.timestamp.getTime() - right.timestamp.getTime()
        || left.source.localeCompare(right.source)
        || left.direction.localeCompare(right.direction)
        || left.sourceRecordId.localeCompare(right.sourceRecordId);
}

export function normalizeAttendanceEvidence(
    evidence: readonly NormalizedAttendanceEvidence[],
): UnifiedAttendanceNormalization {
    const normalized = [...evidence]
        .filter((item) => !Number.isNaN(item.timestamp.getTime()))
        .sort(compareEvidence);
    const firstIn = normalized.find((item) => item.direction === "IN") ?? null;
    const lastOut = [...normalized]
        .reverse()
        .find((item) => item.direction === "OUT") ?? null;

    if (!normalized.length) {
        return {
            evidence: [],
            firstIn: null,
            lastOut: null,
            technicalState: "NO_EVENTS",
            requiresReview: false,
            reviewReasons: [],
        };
    }

    const reviewReasons: string[] = [];

    if (!firstIn) {
        reviewReasons.push("MISSING_IN");
    }

    if (!lastOut) {
        reviewReasons.push("MISSING_OUT");
    }

    if (firstIn && lastOut && lastOut.timestamp < firstIn.timestamp) {
        reviewReasons.push("UNUSUAL_SCAN_PATTERN");
    }

    const technicalState = reviewReasons.includes("UNUSUAL_SCAN_PATTERN")
        ? "NEEDS_REVIEW"
        : firstIn && lastOut
            ? "COMPLETE"
            : firstIn
                ? "MISSING_OUT"
                : "MISSING_IN";

    return {
        evidence: normalized,
        firstIn,
        lastOut,
        technicalState,
        requiresReview: reviewReasons.length > 0,
        reviewReasons,
    };
}
