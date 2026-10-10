import type { QrAttendanceStatus } from "@/types/attendance-qr";

export const attendanceMonitoringPageSizes = [10, 25, 50] as const;
export const defaultAttendanceMonitoringPageSize = 10;

export type AttendanceMonitoringQuery = {
    date: string | null;
    employeeId: string | null;
    department: string | null;
    status: QrAttendanceStatus | null;
    source: "QR" | null;
    search: string;
    page: number;
    pageSize: number;
};

function getTrimmedValue(params: URLSearchParams, key: string, maxLength = 128) {
    const value = params.get(key)?.trim() ?? "";

    return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function getDateValue(params: URLSearchParams, defaultDate: string) {
    const rawDate = params.get("date");

    if (rawDate === null) {
        return defaultDate;
    }

    const date = rawDate.trim();

    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function getPage(params: URLSearchParams) {
    const value = Number.parseInt(params.get("page") ?? "1", 10);

    return Number.isInteger(value) && value > 0 ? Math.min(value, 1000) : 1;
}

function getPageSize(params: URLSearchParams) {
    const value = Number.parseInt(
        params.get("pageSize") ?? String(defaultAttendanceMonitoringPageSize),
        10,
    );

    return attendanceMonitoringPageSizes.includes(value as (typeof attendanceMonitoringPageSizes)[number])
        ? value
        : defaultAttendanceMonitoringPageSize;
}

export function parseAttendanceMonitoringQuery(
    params: URLSearchParams,
    defaultDate: string,
): AttendanceMonitoringQuery {
    const rawStatus = getTrimmedValue(params, "status");
    const rawSource = getTrimmedValue(params, "source");

    return {
        date: getDateValue(params, defaultDate),
        employeeId: getTrimmedValue(params, "employeeId", 64) || null,
        department: getTrimmedValue(params, "department") || null,
        status: rawStatus === "present" || rawStatus === "completed"
            ? rawStatus
            : null,
        source: rawSource === "QR" ? "QR" : null,
        search: getTrimmedValue(params, "search"),
        page: getPage(params),
        pageSize: getPageSize(params),
    };
}
