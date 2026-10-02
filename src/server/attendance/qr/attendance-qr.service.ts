import "server-only";

import { getEmployeeById } from "@/server/repositories/employees/employee.repository";
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

export async function resolveEmployeeAttendanceQr(
    qrValue: string,
): Promise<QrResolveData> {
    const employeeId = verifyEmployeeQrPayload(qrValue);
    const employee = await getEmployeeById(employeeId);

    if (!employee) {
        throw new AttendanceQrEmployeeUnavailableError();
    }

    return {
        employee,
        scannedAt: new Date().toISOString(),
        source: "QR",
    };
}
