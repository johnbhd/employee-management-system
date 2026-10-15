import { NextResponse } from "next/server";

import { FirebaseAdminConfigurationError, FirebaseAdminInitializationError } from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { getAdminAuditLogDetail } from "@/server/admin/admin-audit-logs.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { AdminAuditLog } from "@/types/admin-audit-logs";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ auditId: string }> };

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userContext = await requireApiRoleContext("admin");
    await requireApiPermission("admin.audit_logs.view", userContext.user);
    const { auditId } = await context.params;
    const data = await getAdminAuditLogDetail(auditId);
    if (!data) return errorResponse("ADMIN_AUDIT_NOT_FOUND", "The audit event could not be found.", 404);
    const response: ApiSuccessResponse<AdminAuditLog> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
      return errorResponse("FIREBASE_UNAVAILABLE", "Audit details are temporarily unavailable.", 503);
    }
    return errorResponse("ADMIN_AUDIT_UNAVAILABLE", "Audit details could not be loaded.", 503);
  }
}
