import { NextResponse } from "next/server";

import { requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { findUnifiedAttendanceById } from "@/server/repositories/attendance/unified-attendance.repository";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import { errorResponse } from "../../_shared";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userContext = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.view", userContext.user);
    const { id } = await context.params;
    const data = await findUnifiedAttendanceById(id);

    if (!data) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: { code: "UNIFIED_ATTENDANCE_RECORD_NOT_FOUND", message: "The Unified Attendance record was not found." } },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiSuccessResponse<typeof data>>({ success: true, data });
  } catch (error) {
    return errorResponse(error, "UNIFIED_ATTENDANCE_RECORD_UNAVAILABLE", "The Unified Attendance record could not be loaded.");
  }
}
