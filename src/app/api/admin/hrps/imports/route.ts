import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { listHrpsImportHistory } from "@/server/hrps/hrps-import.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { HrpsImportHistoryData } from "@/types/hrps-import";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

function handleError(error: unknown) {
  if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
  return errorResponse("HRPS_HISTORY_UNAVAILABLE", "HRPS import history could not be loaded.", 503);
}

export async function GET(request: Request) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.view", context.user);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("pageSize")) || 10;
    const data: ApiSuccessResponse<HrpsImportHistoryData> = {
      success: true,
      data: await listHrpsImportHistory(page, pageSize),
    };
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
