import type { ApiSuccessResponse } from "@/types/api/responses";
import type { EmployeeReference } from "@/types/employee";

export type EmployeeQrData = {
    qrValue: string;
    employee: Pick<EmployeeReference, "employeeId" | "displayName">;
    generatedAt: string;
};

export type EmployeeQrSuccessResponse =
    ApiSuccessResponse<EmployeeQrData>;

export type QrResolveRequest = {
    qrValue: string;
};

export type QrAttendanceAction =
    | "time_in"
    | "time_out"
    | "already_completed"
    | "duplicate_scan";

export type QrAttendanceStatus = "present" | "completed";

export type QrAttendanceData = {
    date: string;
    timeIn: string;
    timeOut: string | null;
    timeInSource: "QR";
    timeOutSource: "QR" | null;
    status: QrAttendanceStatus;
};

export type QrResolveData = {
    employee: EmployeeReference;
    scannedAt: string;
    source: "QR";
    attendance: QrAttendanceData;
    action: QrAttendanceAction;
};

export type QrResolveSuccessResponse =
    ApiSuccessResponse<QrResolveData>;

export type TodayAttendanceData = {
    attendanceDate: string;
    attendance: QrAttendanceData | null;
};

export type TodayAttendanceSuccessResponse =
    ApiSuccessResponse<TodayAttendanceData>;
