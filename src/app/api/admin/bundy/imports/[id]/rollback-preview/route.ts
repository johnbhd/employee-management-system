import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { BundyRollbackError, getBundyRollbackPreview } from "@/server/bundy/bundy-rollback.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { BundyRollbackPreview } from "@/types/bundy-import";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.retry", context.user);
    const { id } = await params;
    const data: ApiSuccessResponse<BundyRollbackPreview> = { success: true, data: await getBundyRollbackPreview(id) };
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    if (error instanceof BundyRollbackError) return errorResponse(error.code, error.message, error.status);
    return errorResponse("BUNDY_ROLLBACK_PREVIEW_UNAVAILABLE", "The Bundy rollback preview could not be generated.", 503);
  }
}
