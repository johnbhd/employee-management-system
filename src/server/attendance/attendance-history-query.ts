import "server-only";

import type {
    AttendanceHistoryQuery,
    AttendanceHistoryStatus,
} from "@/types/attendance-history";

export const attendanceHistoryPageSizes = [10, 25, 50] as const;

export const defaultAttendanceHistoryQuery: AttendanceHistoryQuery = {
    status: null,
    month: "",
    date: "",
    page: 1,
    pageSize: 10,
};

export class AttendanceHistoryQueryError extends Error {
    readonly code = "ATTENDANCE_HISTORY_QUERY_INVALID";

    constructor() {
        super("The attendance history filters are invalid.");
        this.name = "AttendanceHistoryQueryError";
    }
}

export function parseAttendanceHistoryQuery(
    params: URLSearchParams,
): AttendanceHistoryQuery {
    const statusValue = params.get("status")?.trim() ?? "";
    const month = params.get("month")?.trim() ?? "";
    const date = params.get("date")?.trim() ?? "";
    const pageValue = params.get("page")?.trim() ?? "1";
    const pageSizeValue = params.get("pageSize")?.trim() ?? "10";
    const status = statusValue || null;
    const page = Number(pageValue);
    const pageSize = Number(pageSizeValue);

    if (
        (status !== null && !isAttendanceHistoryStatus(status))
        || (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
        || date.length > 64
        || !/^\d+$/.test(pageValue)
        || page < 1
        || page > 1000
        || !/^\d+$/.test(pageSizeValue)
        || !attendanceHistoryPageSizes.includes(
            pageSize as (typeof attendanceHistoryPageSizes)[number],
        )
    ) {
        throw new AttendanceHistoryQueryError();
    }

    return {
        status,
        month,
        date,
        page,
        pageSize,
    };
}

function isAttendanceHistoryStatus(
    value: string,
): value is AttendanceHistoryStatus {
    return value === "present" || value === "completed";
}
