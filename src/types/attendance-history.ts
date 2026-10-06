import type { ApiSuccessResponse } from "@/types/api/responses";
import type { QrAttendanceData, QrAttendanceStatus } from "@/types/attendance-qr";

export type AttendanceHistoryRecordData = QrAttendanceData & {
    id: string;
};

export type AttendanceCalendarRecord = Pick<
    AttendanceHistoryRecordData,
    "id" | "date" | "status"
>;

export type AttendanceHistoryData = {
    records: AttendanceHistoryRecordData[];
    page: number;
    pageSize: number;
    total: number;
    totalRecords: number;
    availableMonths: string[];
    oldestDate: string | null;
    newestDate: string | null;
};

export type AttendanceHistorySuccessResponse =
    ApiSuccessResponse<AttendanceHistoryData>;

export type AttendanceHistoryStatus = QrAttendanceStatus;

export type AttendanceHistoryQuery = {
    status: AttendanceHistoryStatus | null;
    month: string;
    date: string;
    page: number;
    pageSize: number;
};
