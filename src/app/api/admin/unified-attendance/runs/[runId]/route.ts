import { NextResponse } from "next/server";

import { requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { getUnifiedAttendanceProcessingRun } from "@/server/attendance/unified-attendance-processing.service";
import type { ApiSuccessResponse } from "@/types/api/responses";
import { errorResponse } from "../../_shared";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    const userContext = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.view", userContext.user);
    const { runId } = await context.params;
    const data = await getUnifiedAttendanceProcessingRun(runId);
    return NextResponse.json<ApiSuccessResponse<typeof data>>({ success: true, data });
  } catch (error) {
    return errorResponse(error, "UNIFIED_ATTENDANCE_RUN_UNAVAILABLE", "The processing run could not be loaded.");
  }
}
