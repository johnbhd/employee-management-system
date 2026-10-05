import { NextResponse } from "next/server";

import { getTodayAttendanceForEmployee } from "@/server/attendance/attendance.service";
import {
    ApiAuthorizationError,
    requireApiRoleContext,
} from "@/server/auth/guards";
import {
    FirebaseAdminConfigurationError,
    FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import type { ApiErrorResponse } from "@/types/api/responses";
import type {
    TodayAttendanceData,
    TodayAttendanceSuccessResponse,
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

export async function GET() {
    let context: Awaited<ReturnType<typeof requireApiRoleContext>>;

    try {
        context = await requireApiRoleContext("employee");
    } catch (error) {
        if (error instanceof ApiAuthorizationError) {
            return getErrorResponse(error.code, error.message, error.status);
        }

        return getErrorResponse(
            "ATTENDANCE_UNAVAILABLE",
            "Today's attendance is temporarily unavailable.",
            503,
        );
    }

    if (!context.employee) {
        return getErrorResponse(
            "EMPLOYEE_UNAVAILABLE",
            "The authenticated employee record is unavailable.",
            403,
        );
    }

    try {
        const data: TodayAttendanceData =
            await getTodayAttendanceForEmployee(context.employee.employeeId);
        const response: TodayAttendanceSuccessResponse = {
            success: true,
            data,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        if (
            error instanceof FirebaseAdminConfigurationError
            || error instanceof FirebaseAdminInitializationError
        ) {
            return getErrorResponse(
                "FIREBASE_UNAVAILABLE",
                "Today's attendance is temporarily unavailable.",
                503,
            );
        }

        return getErrorResponse(
            "ATTENDANCE_UNAVAILABLE",
            "Today's attendance is temporarily unavailable.",
            503,
        );
    }
}
