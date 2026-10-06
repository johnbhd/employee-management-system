import type { QrAttendanceStatus } from "@/types/attendance-qr";

import {
    attendanceReportTypes,
    type AttendanceReportType,
} from "@/data/hr-attendance-reports";

export type AttendanceReportsQuery = {
    reportType: AttendanceReportType;
    date: string;
    month: string;
    employeeId: string | null;
    department: string | null;
    status: QrAttendanceStatus | null;
    source: "QR" | null;
};

function getTrimmedValue(params: URLSearchParams, key: string, maxLength = 128) {
    const value = params.get(key)?.trim() ?? "";

    return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function getDateValue(params: URLSearchParams, key: string, fallback: string) {
    const value = params.get(key)?.trim() ?? "";

    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

function getMonthValue(params: URLSearchParams, fallback: string) {
    const value = params.get("month")?.trim() ?? "";

    return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : fallback;
}

function getReportType(params: URLSearchParams): AttendanceReportType {
    const value = params.get("report");

    return attendanceReportTypes.some((report) => report.id === value)
        ? value as AttendanceReportType
        : "daily";
}

export function parseAttendanceReportsQuery(
    params: URLSearchParams,
    defaultDate: string,
): AttendanceReportsQuery {
    const reportType = getReportType(params);
    const rawStatus = getTrimmedValue(params, "status");
    const rawSource = getTrimmedValue(params, "source");

    return {
        reportType,
        date: getDateValue(params, "date", defaultDate),
        month: getMonthValue(params, defaultDate.slice(0, 7)),
        employeeId: getTrimmedValue(params, "employeeId", 64) || null,
        department: getTrimmedValue(params, "department") || null,
        status: reportType === "daily"
            ? rawStatus === "present" || rawStatus === "completed"
                ? rawStatus
                : null
            : null,
        source: reportType !== "monthly"
            && reportType !== "source-usage"
            && reportType !== "correction-summary"
            && rawSource === "QR"
            ? "QR"
            : null,
    };
}
