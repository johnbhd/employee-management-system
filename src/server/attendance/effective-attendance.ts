import "server-only";

export type EffectiveAttendanceValues = {
    timeIn: Date | null;
    timeOut: Date | null;
};

function requestedTimestamp(value: unknown) {
    if (typeof value !== "string") {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function resolveEffectiveAttendance(input: {
    original: EffectiveAttendanceValues;
    approvedRequestedChanges?: unknown;
}): EffectiveAttendanceValues {
    const changes = input.approvedRequestedChanges;
    const requested = typeof changes === "object" && changes !== null && !Array.isArray(changes)
        ? changes as Record<string, unknown>
        : {};

    return {
        timeIn: requestedTimestamp(requested.timeIn) ?? input.original.timeIn,
        timeOut: requestedTimestamp(requested.timeOut) ?? input.original.timeOut,
    };
}
