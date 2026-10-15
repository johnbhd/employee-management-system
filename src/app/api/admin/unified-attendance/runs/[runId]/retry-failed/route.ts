import { NextResponse } from "next/server";

import { requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { retryUnifiedAttendanceProcessing } from "@/server/attendance/unified-attendance-processing.service";
import type { ApiSuccessResponse } from "@/types/api/responses";
import { errorResponse } from "../../../_shared";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    const userContext = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.retry", userContext.user);
    const { runId } = await context.params;
    const data = await retryUnifiedAttendanceProcessing({ runId, actor: userContext.user });
    return NextResponse.json<ApiSuccessResponse<typeof data>>({ success: true, data });
  } catch (error) {
    return errorResponse(error, "UNIFIED_ATTENDANCE_RETRY_UNAVAILABLE", "Failed Unified Attendance items could not be retried safely.");
  }
}
