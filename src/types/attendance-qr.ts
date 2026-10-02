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

export type QrResolveData = {
    employee: EmployeeReference;
    scannedAt: string;
    source: "QR";
};

export type QrResolveSuccessResponse =
    ApiSuccessResponse<QrResolveData>;
