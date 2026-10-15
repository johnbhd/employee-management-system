import { NextResponse } from "next/server";

import { requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { reprocessUnifiedAttendance } from "@/server/attendance/unified-attendance-processing.service";
import type { ApiSuccessResponse } from "@/types/api/responses";
import { errorResponse, readJsonBody, requiredDate } from "../_shared";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.retry", context.user);
    const body = await readJsonBody(request);
    const data = await reprocessUnifiedAttendance({
      dateFrom: requiredDate(body, "dateFrom"),
      dateTo: requiredDate(body, "dateTo"),
      actor: context.user,
    });
    return NextResponse.json<ApiSuccessResponse<typeof data>>({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "UNIFIED_ATTENDANCE_REPROCESS_UNAVAILABLE", "Unified Attendance reprocessing could not be completed safely.");
  }
}
