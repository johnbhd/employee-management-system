import { NextResponse } from "next/server";

import { requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import {
  listUnifiedAttendanceProcessingRuns,
  startUnifiedAttendanceProcessing,
} from "@/server/attendance/unified-attendance-processing.service";
import type { ApiSuccessResponse } from "@/types/api/responses";
import { errorResponse, pageParam, readJsonBody, requiredDate } from "../_shared";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.view", context.user);
    const url = new URL(request.url);
    const data = await listUnifiedAttendanceProcessingRuns({
      page: pageParam(url.searchParams.get("page"), 1),
      pageSize: pageParam(url.searchParams.get("pageSize"), 25),
    });
    return NextResponse.json<ApiSuccessResponse<typeof data>>({ success: true, data });
  } catch (error) {
    return errorResponse(error, "UNIFIED_ATTENDANCE_RUNS_UNAVAILABLE", "Processing run history could not be loaded.");
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.retry", context.user);
    const body = await readJsonBody(request);
    const data = await startUnifiedAttendanceProcessing({
      dateFrom: requiredDate(body, "dateFrom"),
      dateTo: requiredDate(body, "dateTo"),
      actor: context.user,
    });
    return NextResponse.json<ApiSuccessResponse<typeof data>>({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "UNIFIED_ATTENDANCE_PROCESSING_UNAVAILABLE", "Unified Attendance processing could not be completed safely.");
  }
}
