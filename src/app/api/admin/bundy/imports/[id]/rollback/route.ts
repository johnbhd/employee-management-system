import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { BundyRollbackError, rollbackBundyImport } from "@/server/bundy/bundy-rollback.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { BundyRollbackResult } from "@/types/bundy-import";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.retry", context.user);
    let body: unknown = null;
    try {
      body = await _request.json();
    } catch {
      body = null;
    }
    if (!body || typeof body !== "object" || (body as { confirmation?: unknown }).confirmation !== "UNDO_IMPORT") {
      return errorResponse("BUNDY_ROLLBACK_CONFIRMATION_REQUIRED", "Confirm the Undo import action before retrying.", 400);
    }
    const { id } = await params;
    const data: ApiSuccessResponse<BundyRollbackResult> = {
      success: true,
      data: await rollbackBundyImport({ importId: id, actor: context.user }),
    };
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    if (error instanceof BundyRollbackError) return errorResponse(error.code, error.message, error.status);
    return errorResponse("BUNDY_ROLLBACK_UNAVAILABLE", "The Bundy rollback could not be completed safely.", 503);
  }
}
