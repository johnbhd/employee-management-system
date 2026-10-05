import { NextResponse } from "next/server";

import {
    AttendanceHistoryQueryError,
    parseAttendanceHistoryQuery,
} from "@/server/attendance/attendance-history-query";
import { getAttendanceHistoryForEmployee } from "@/server/attendance/attendance.service";
import {
    ApiAuthorizationError,
    requireApiRoleContext,
} from "@/server/auth/guards";
import {
    FirebaseAdminConfigurationError,
    FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import type { ApiErrorResponse } from "@/types/api/responses";
import type { AttendanceHistorySuccessResponse } from "@/types/attendance-history";

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

export async function GET(request: Request) {
    let context: Awaited<ReturnType<typeof requireApiRoleContext>>;

    try {
        context = await requireApiRoleContext("employee");
    } catch (error) {
        if (error instanceof ApiAuthorizationError) {
            return getErrorResponse(error.code, error.message, error.status);
        }

        return getErrorResponse(
            "ATTENDANCE_HISTORY_UNAVAILABLE",
            "Attendance history is temporarily unavailable.",
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

    let query;

    try {
        query = parseAttendanceHistoryQuery(
            new URL(request.url).searchParams,
        );
    } catch (error) {
        if (error instanceof AttendanceHistoryQueryError) {
            return getErrorResponse(
                error.code,
                error.message,
                400,
            );
        }

        return getErrorResponse(
            "ATTENDANCE_HISTORY_QUERY_INVALID",
            "The attendance history filters are invalid.",
            400,
        );
    }

    try {
        const data = await getAttendanceHistoryForEmployee(
            context.employee.employeeId,
            query,
        );
        const response: AttendanceHistorySuccessResponse = {
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
                "Attendance history is temporarily unavailable.",
                503,
            );
        }

        return getErrorResponse(
            "ATTENDANCE_HISTORY_UNAVAILABLE",
            "Attendance history is temporarily unavailable.",
            503,
        );
    }
}
