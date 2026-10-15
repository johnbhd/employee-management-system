import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { parseHrAttendanceReviewQuery } from "@/server/hr/attendance-review-query";
import { getHrAttendanceReviewData } from "@/server/hr/attendance-review.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { HrAttendanceReviewData } from "@/types/hr-attendance-review";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
    return NextResponse.json<ApiErrorResponse>(
        { success: false, error: { code, message } },
        { status },
    );
}

export async function GET(request: Request) {
    let context: Awaited<ReturnType<typeof requireApiRoleContext>>;

    try {
        context = await requireApiRoleContext("hr");
        await requireApiPermission("hr.attendance.view", context.user);
    } catch (error) {
        if (error instanceof ApiAuthorizationError) {
            return errorResponse(error.code, error.message, error.status);
        }

        return errorResponse(
            "HR_ATTENDANCE_REVIEW_UNAVAILABLE",
            "HR attendance review is temporarily unavailable.",
            503,
        );
    }

    try {
        const query = parseHrAttendanceReviewQuery(new URL(request.url).searchParams);
        const data = await getHrAttendanceReviewData(query, {
            canReviewCorrections: await hasPermissionFor(context.user, "hr.correction.review"),
            canVerifyAttendance: await hasPermissionFor(context.user, "hr.attendance.verify"),
        });
        return NextResponse.json<ApiSuccessResponse<HrAttendanceReviewData>>({
            success: true,
            data,
        });
    } catch {
        return errorResponse(
            "HR_ATTENDANCE_REVIEW_UNAVAILABLE",
            "HR attendance review is temporarily unavailable.",
            503,
        );
    }
}

async function hasPermissionFor(
    user: Awaited<ReturnType<typeof requireApiRoleContext>>["user"],
    permission: "hr.correction.review" | "hr.attendance.verify",
) {
    try {
        await requireApiPermission(permission, user);
        return true;
    } catch {
        return false;
    }
}
