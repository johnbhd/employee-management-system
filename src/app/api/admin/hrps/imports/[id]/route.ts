import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { getHrpsImportHistory } from "@/server/hrps/hrps-import.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { HrpsImportHistoryItem } from "@/types/hrps-import";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.view", context.user);
    const { id } = await params;
    const data = await getHrpsImportHistory(id);
    if (!data) return errorResponse("HRPS_IMPORT_NOT_FOUND", "The HRPS import record was not found.", 404);
    const response: ApiSuccessResponse<HrpsImportHistoryItem> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    return errorResponse("HRPS_HISTORY_UNAVAILABLE", "The HRPS import record could not be loaded.", 503);
  }
}
