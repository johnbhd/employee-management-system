import "server-only";

import { formatCampusDateKey } from "@/lib/campus-time";
import {
    getAttendanceByEmployeeAndDate,
    type StoredQrAttendanceRecord,
} from "@/server/repositories/attendance/attendance.repository";
import type {
    QrAttendanceData,
    TodayAttendanceData,
} from "@/types/attendance-qr";

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
