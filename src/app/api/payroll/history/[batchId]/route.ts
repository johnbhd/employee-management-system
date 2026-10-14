import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import {
  getPayrollHistoryDetail,
  PayrollHistoryValidationError,
} from "@/server/payroll/payroll-history.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ batchId: string }> },
) {
  try {
    const authContext = await requireApiRoleContext("payroll");
    await requireApiPermission("payroll.history.view", authContext.user);
    const { batchId } = await context.params;
    if (!batchId.trim()) return errorResponse("PAYROLL_HISTORY_NOT_FOUND", "The payroll history record could not be found.", 404);
    const data = await getPayrollHistoryDetail(batchId);
    if (!data) return errorResponse("PAYROLL_HISTORY_NOT_FOUND", "The payroll history record could not be found.", 404);
    const response: ApiSuccessResponse<typeof data> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    if (error instanceof PayrollHistoryValidationError) return errorResponse(error.code, error.message, 400);
    if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
      return errorResponse("FIREBASE_UNAVAILABLE", "Payroll history data is temporarily unavailable.", 503);
    }
    return errorResponse("PAYROLL_HISTORY_UNAVAILABLE", "Payroll history details are temporarily unavailable.", 503);
  }
}
