import "server-only";

import { formatCampusDateKey } from "@/lib/campus-time";
import { getEmployeeById } from "@/server/repositories/employees/employee.repository";
import { recordQrAttendance } from "@/server/repositories/attendance/attendance.repository";
import type { SessionUser } from "@/types/auth";
import type {
    EmployeeQrData,
    QrResolveData,
} from "@/types/attendance-qr";
import type { EmployeeReference } from "@/types/employee";

import {
    createEmployeeQrPayload,
    verifyEmployeeQrPayload,
} from "./attendance-qr-token";

export class AttendanceQrEmployeeUnavailableError extends Error {
    readonly code = "ATTENDANCE_QR_EMPLOYEE_UNAVAILABLE";

    constructor() {
        super("The employee record for this QR is unavailable.");
        this.name = "AttendanceQrEmployeeUnavailableError";
    }
}

export function createEmployeeQrData(
    employee: EmployeeReference,
): EmployeeQrData {
    return {
        qrValue: createEmployeeQrPayload(employee.employeeId),
        employee: {
            employeeId: employee.employeeId,
            displayName: employee.displayName,
        },
        generatedAt: new Date().toISOString(),
    };
}

export async function recordEmployeeQrAttendance(
    qrValue: string,
    scannerOperator: SessionUser,
): Promise<QrResolveData> {
    const employeeId = verifyEmployeeQrPayload(qrValue);
    const employee = await getEmployeeById(employeeId);

    if (!employee) {
        throw new AttendanceQrEmployeeUnavailableError();
    }

    const scannedAt = new Date();
    const attendanceResult = await recordQrAttendance({
        attendanceDate: formatCampusDateKey(scannedAt),
        employeeId: employee.employeeId,
        occurredAt: scannedAt,
        scannerOperator,
    });

    return {
        action: attendanceResult.action,
        attendance: {
            date: attendanceResult.record.attendanceDate,
            status: attendanceResult.record.status,
            timeIn: attendanceResult.record.timeIn.toDate().toISOString(),
            timeInSource: attendanceResult.record.timeInSource,
            timeOut: attendanceResult.record.timeOut?.toDate().toISOString()
                ?? null,
            timeOutSource: attendanceResult.record.timeOutSource,
        },
        employee,
        scannedAt: scannedAt.toISOString(),
        source: "QR",
    };
}
