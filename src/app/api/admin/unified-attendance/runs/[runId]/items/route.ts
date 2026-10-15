import { NextResponse } from "next/server";

import { requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { listUnifiedAttendanceProcessingItems } from "@/server/attendance/unified-attendance-processing.service";
import type { ApiSuccessResponse } from "@/types/api/responses";
import { errorResponse, pageParam } from "../../../_shared";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    const userContext = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.view", userContext.user);
    const { runId } = await context.params;
    const url = new URL(request.url);
    const data = await listUnifiedAttendanceProcessingItems({
      runId,
      page: pageParam(url.searchParams.get("page"), 1),
      pageSize: pageParam(url.searchParams.get("pageSize"), 50),
      status: url.searchParams.get("status") ?? undefined,
    });
    return NextResponse.json<ApiSuccessResponse<typeof data>>({ success: true, data });
  } catch (error) {
    return errorResponse(error, "UNIFIED_ATTENDANCE_ITEMS_UNAVAILABLE", "Processing run items could not be loaded.");
  }
}
