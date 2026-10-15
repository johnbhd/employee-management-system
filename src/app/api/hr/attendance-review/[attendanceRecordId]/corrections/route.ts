import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import {
    createAttendanceReviewCorrection,
    mapHrAttendanceReviewError,
} from "@/server/hr/attendance-review.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{ attendanceRecordId: string }>;
};

function errorResponse(code: string, message: string, status: number) {
    return NextResponse.json<ApiErrorResponse>(
        { success: false, error: { code, message } },
        { status },
    );
}

export async function POST(request: Request, context: RouteContext) {
    let actor: Awaited<ReturnType<typeof requireApiRoleContext>>["user"];
    let attendanceRecordId: string;

    try {
        const roleContext = await requireApiRoleContext("hr");
        await requireApiPermission("hr.correction.review", roleContext.user);
        actor = roleContext.user;
        ({ attendanceRecordId } = await context.params);
    } catch (error) {
        if (error instanceof ApiAuthorizationError) {
            return errorResponse(error.code, error.message, error.status);
        }

        return errorResponse("UNAUTHORIZED", "Authentication is required.", 401);
    }

    if (!/^[0-9a-f-]{36}$/i.test(attendanceRecordId)) {
        return errorResponse(
            "HR_ATTENDANCE_ID_INVALID",
            "The attendance record identifier is invalid.",
            400,
        );
    }

    try {
        const payload: unknown = await request.json();
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            return errorResponse(
                "HR_ATTENDANCE_VALIDATION_ERROR",
                "A JSON object is required.",
                400,
            );
        }

        const result = await createAttendanceReviewCorrection({
            attendanceRecordId,
            payload: payload as Record<string, unknown>,
            actor,
        });
        return NextResponse.json<ApiSuccessResponse<typeof result>>({
            success: true,
            data: result,
        }, { status: 201 });
    } catch (error) {
        const mapped = mapHrAttendanceReviewError(error);
        return errorResponse(mapped.code, mapped.message, mapped.status);
    }
}
