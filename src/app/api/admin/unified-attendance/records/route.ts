import { NextResponse } from "next/server";

import { requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import {
  countUnifiedAttendance,
  listUnifiedAttendance,
} from "@/server/repositories/attendance/unified-attendance.repository";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type {
  UnifiedAttendanceBusinessStatus,
  UnifiedAttendanceTechnicalState,
} from "@/types/unified-attendance";
import { errorResponse, pageParam } from "../_shared";

export const runtime = "nodejs";

const technicalStates: UnifiedAttendanceTechnicalState[] = [
  "NO_EVENTS",
  "IN_PROGRESS",
  "COMPLETE",
  "MISSING_IN",
  "MISSING_OUT",
  "NEEDS_REVIEW",
];

const businessStatuses: UnifiedAttendanceBusinessStatus[] = [
  "UNCLASSIFIED",
  "PRESENT",
  "LATE",
  "ABSENT",
];

function optionalEnum<T extends string>(value: string | null, allowed: readonly T[]) {
  return value && allowed.includes(value as T) ? value as T : undefined;
}

function optionalBoolean(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function GET(request: Request) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.view", context.user);

    const url = new URL(request.url);
    const params = url.searchParams;
    const data = await listUnifiedAttendance({
      search: params.get("search")?.trim() || undefined,
      department: params.get("department")?.trim() || undefined,
      fromDate: params.get("fromDate") || undefined,
      toDate: params.get("toDate") || undefined,
      technicalState: optionalEnum(params.get("technicalState"), technicalStates),
      businessStatus: optionalEnum(params.get("businessStatus"), businessStatuses),
      requiresReview: optionalBoolean(params.get("requiresReview")),
      page: pageParam(params.get("page"), 1),
      pageSize: pageParam(params.get("pageSize"), 25),
    });
    const reviewCount = await countUnifiedAttendance({ requiresReview: true });
    const response = {
      items: data.rows,
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      hasNext: data.hasNext,
      reviewCount,
    };

    return NextResponse.json<ApiSuccessResponse<typeof response>>({ success: true, data: response });
  } catch (error) {
    return errorResponse(error, "UNIFIED_ATTENDANCE_RECORDS_UNAVAILABLE", "Unified Attendance records could not be loaded.");
  }
}
