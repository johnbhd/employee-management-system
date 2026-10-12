import { NextResponse } from "next/server";

import { FirebaseAdminConfigurationError, FirebaseAdminInitializationError } from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { getAdminAuditLogsData, getDefaultAdminAuditLogsQuery, parseAdminAuditOutcome } from "@/server/admin/admin-audit-logs.service";
import type { AdminAuditLogsData } from "@/types/admin-audit-logs";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

export async function GET(request: Request) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.audit_logs.view", context.user);
    const params = new URL(request.url).searchParams;
    const defaults = getDefaultAdminAuditLogsQuery();
    const page = Number(params.get("page") ?? defaults.page);
    const pageSize = Number(params.get("pageSize") ?? defaults.pageSize);
    const rawOutcome = params.get("outcome");
    const outcome = parseAdminAuditOutcome(rawOutcome);
    if (!Number.isInteger(page) || !Number.isInteger(pageSize) || page < 1 || pageSize < 1 || pageSize > 50 || (rawOutcome && !outcome)) {
      return errorResponse("ADMIN_AUDIT_QUERY_INVALID", "The audit log filters are invalid.", 400);
    }
    const data = await getAdminAuditLogsData({
      search: params.get("search")?.trim() ?? "",
      from: params.get("from")?.trim() || null,
      to: params.get("to")?.trim() || null,
      role: params.get("role")?.trim() || null,
      module: params.get("module")?.trim() || null,
      action: params.get("action")?.trim() || null,
      outcome,
      page,
      pageSize,
    });
    const response: ApiSuccessResponse<AdminAuditLogsData> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
      return errorResponse("FIREBASE_UNAVAILABLE", "Audit logs are temporarily unavailable.", 503);
    }
    return errorResponse("ADMIN_AUDIT_UNAVAILABLE", "Audit logs could not be loaded.", 503);
  }
}
