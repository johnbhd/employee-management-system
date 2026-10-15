import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { HrpsRollbackError, rollbackHrpsImport } from "@/server/hrps/hrps-rollback.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { HrpsRollbackResult } from "@/types/hrps-import";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.retry", context.user);
    const { id } = await params;
    const data: ApiSuccessResponse<HrpsRollbackResult> = {
      success: true,
      data: await rollbackHrpsImport({ importId: id, actor: context.user }),
    };
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    if (error instanceof HrpsRollbackError) return errorResponse(error.code, error.message, error.status);
    return errorResponse("HRPS_ROLLBACK_UNAVAILABLE", "The HRPS rollback could not be completed safely.", 503);
  }
}
