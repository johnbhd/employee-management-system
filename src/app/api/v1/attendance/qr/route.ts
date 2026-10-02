import { NextResponse } from "next/server";

import {
    AttendanceQrConfigurationError,
} from "@/server/attendance/qr/attendance-qr-token";
import { createEmployeeQrData } from "@/server/attendance/qr/attendance-qr.service";
import {
    requireApiRoleContext,
    ApiAuthorizationError,
} from "@/server/auth/guards";
import {
    FirebaseAdminConfigurationError,
    FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import type { ApiErrorResponse } from "@/types/api/responses";
import type { EmployeeQrSuccessResponse } from "@/types/attendance-qr";

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

export async function GET() {
    try {
        const context = await requireApiRoleContext("employee");

        if (!context.employee) {
            return getErrorResponse(
                "EMPLOYEE_REFERENCE_UNAVAILABLE",
                "Your employee QR is currently unavailable. Please contact the system administrator.",
                403,
            );
        }

        const response: EmployeeQrSuccessResponse = {
            success: true,
            data: createEmployeeQrData(context.employee),
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        if (error instanceof ApiAuthorizationError) {
            return getErrorResponse(error.code, error.message, error.status);
        }

        if (error instanceof AttendanceQrConfigurationError) {
            return getErrorResponse(
                "QR_ATTENDANCE_UNAVAILABLE",
                "Employee QR generation is not configured yet.",
                503,
            );
        }

        if (
            error instanceof FirebaseAdminConfigurationError
            || error instanceof FirebaseAdminInitializationError
        ) {
            return getErrorResponse(
                "FIREBASE_UNAVAILABLE",
                "Employee QR information is temporarily unavailable.",
                503,
            );
        }

        return getErrorResponse(
            "QR_ATTENDANCE_UNAVAILABLE",
            "Employee QR information is temporarily unavailable.",
            503,
        );
    }
}
