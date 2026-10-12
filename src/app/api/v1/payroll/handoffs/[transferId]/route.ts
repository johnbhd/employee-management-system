import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { getPayrollHandoffDetail } from "@/server/payroll/payroll-handoff.service";
import { ApiAuthorizationError, requireApiRoleContext } from "@/server/auth/guards";
import { PayrollHandoffDataError } from "@/server/repositories/payroll-handoffs/payroll-handoff.repository";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { PayrollHandoffRecord } from "@/types/payroll-handoff";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ transferId: string }> };

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireApiRoleContext("payroll");
    const { transferId } = await context.params;
    const data = await getPayrollHandoffDetail(transferId);
    if (!data) return errorResponse("PAYROLL_HANDOFF_NOT_FOUND", "The payroll handoff could not be found.", 404);
    const response: ApiSuccessResponse<PayrollHandoffRecord> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    if (error instanceof PayrollHandoffDataError) return errorResponse(error.code, error.message, 500);
    if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
      return errorResponse("FIREBASE_UNAVAILABLE", "Payroll handoff data is temporarily unavailable.", 503);
    }
    return errorResponse("PAYROLL_HANDOFF_UNAVAILABLE", "Payroll handoff details are temporarily unavailable.", 503);
  }
}
