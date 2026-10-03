import { NextResponse } from "next/server";

import {
    AttendanceQrConfigurationError,
    AttendanceQrValidationError,
} from "@/server/attendance/qr/attendance-qr-token";
import {
    AttendanceQrEmployeeUnavailableError,
    resolveEmployeeAttendanceQr,
} from "@/server/attendance/qr/attendance-qr.service";
import { requireApiRoles, ApiAuthorizationError } from "@/server/auth/guards";
import {
    FirebaseAdminConfigurationError,
    FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import type { ApiErrorResponse } from "@/types/api/responses";
import type {
    QrResolveRequest,
    QrResolveSuccessResponse,
} from "@/types/attendance-qr";

export const runtime = "nodejs";

function getErrorResponse(
    code: string,
    message: string,
    status: number,
): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
        {
            success: false,
            error: {
                code,
                message,
            },
        },
        { status },
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
    try {
        await requireApiRoles("hr", "admin");
    } catch (error) {
        if (error instanceof ApiAuthorizationError) {
            return getErrorResponse(error.code, error.message, error.status);
        }

        return getErrorResponse(
            "SCANNER_UNAVAILABLE",
            "The scanner is temporarily unavailable.",
            503,
        );
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return getErrorResponse(
            "INVALID_REQUEST",
            "A QR value is required.",
            400,
        );
    }

    if (
        !isRecord(body)
        || typeof body.qrValue !== "string"
        || !body.qrValue.trim()
        || body.qrValue.length > 2048
    ) {
        return getErrorResponse(
            "INVALID_REQUEST",
            "A QR value is required.",
            400,
        );
    }

    const requestData: QrResolveRequest = {
        qrValue: body.qrValue.trim(),
    };

    try {
        const data = await resolveEmployeeAttendanceQr(requestData.qrValue);
        const response: QrResolveSuccessResponse = {
            success: true,
            data,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        if (error instanceof AttendanceQrValidationError) {
            return getErrorResponse(
                "INVALID_ATTENDANCE_QR",
                "Invalid or unrecognized employee QR.",
                422,
            );
        }

        if (error instanceof AttendanceQrEmployeeUnavailableError) {
            return getErrorResponse(
                "EMPLOYEE_UNAVAILABLE",
                "The employee record for this QR is unavailable.",
                404,
            );
        }

        if (error instanceof AttendanceQrConfigurationError) {
            return getErrorResponse(
                "QR_ATTENDANCE_UNAVAILABLE",
                "QR validation is not configured yet.",
                503,
            );
        }

        if (
            error instanceof FirebaseAdminConfigurationError
            || error instanceof FirebaseAdminInitializationError
        ) {
            return getErrorResponse(
                "FIREBASE_UNAVAILABLE",
                "Employee information is temporarily unavailable.",
                503,
            );
        }

        return getErrorResponse(
            "QR_ATTENDANCE_UNAVAILABLE",
            "Employee information is temporarily unavailable.",
            503,
        );
    }
}
