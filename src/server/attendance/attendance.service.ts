import "server-only";

import {
    formatCampusDateKey,
    formatCampusDateKeyLabel,
} from "@/lib/campus-time";
import {
    getAttendanceByEmployeeAndDate,
    listAttendanceByEmployee,
    type StoredQrAttendanceRecord,
} from "@/server/repositories/attendance/attendance.repository";
import type {
    QrAttendanceData,
    TodayAttendanceData,
} from "@/types/attendance-qr";
import type {
    AttendanceHistoryData,
    AttendanceHistoryRecordData,
    AttendanceHistoryQuery,
} from "@/types/attendance-history";

export function serializeAttendanceRecord(
    record: StoredQrAttendanceRecord,
): QrAttendanceData {
    return {
        date: record.attendanceDate,
        status: record.status,
        timeIn: record.timeIn.toDate().toISOString(),
        timeInSource: record.timeInSource,
        timeOut: record.timeOut?.toDate().toISOString() ?? null,
        timeOutSource: record.timeOutSource,
    };
}

export async function getTodayAttendanceForEmployee(
    employeeId: string,
    now = new Date(),
): Promise<TodayAttendanceData> {
    const attendanceDate = formatCampusDateKey(now);
    const record = await getAttendanceByEmployeeAndDate(
        employeeId,
        attendanceDate,
    );

    return {
        attendance: record ? serializeAttendanceRecord(record) : null,
        attendanceDate,
    };
}

export async function getAttendanceHistoryForEmployee(
    employeeId: string,
    query: AttendanceHistoryQuery,
): Promise<AttendanceHistoryData> {
    const records = await listAttendanceByEmployee(employeeId);
    const serializedRecords: AttendanceHistoryRecordData[] = records.map(
        ({ id, record }) => ({
            id,
            ...serializeAttendanceRecord(record),
        }),
    );
    const availableMonths = Array.from(
        new Set(serializedRecords.map((record) => record.date.slice(0, 7))),
    );
    const filteredRecords = serializedRecords.filter((record) => {
        const matchesStatus = !query.status || record.status === query.status;
        const matchesMonth = !query.month || record.date.startsWith(query.month);
        const search = query.date.toLowerCase();
        const matchesDate =
            !search
            || record.date.toLowerCase().includes(search)
            || formatCampusDateKeyLabel(record.date).toLowerCase().includes(search)
            || formatCampusDateKeyLabel(record.date, "long")
                .toLowerCase()
                .includes(search);

        return matchesStatus && matchesMonth && matchesDate;
    });
    const total = filteredRecords.length;
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const pageStart = (page - 1) * query.pageSize;

    return {
        records: filteredRecords.slice(pageStart, pageStart + query.pageSize),
        page,
        pageSize: query.pageSize,
        total,
        totalRecords: serializedRecords.length,
        availableMonths,
        oldestDate: serializedRecords.at(-1)?.date ?? null,
        newestDate: serializedRecords[0]?.date ?? null,
    };
}
