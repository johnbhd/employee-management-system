import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiRoleContext } from "@/server/auth/guards";
import { getPayrollResultDetail } from "@/server/payroll/payroll-result.service";
import { PayrollResultDataError } from "@/server/repositories/payroll-results/payroll-result.repository";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ resultId: string }> },
) {
  void request;
  try {
    await requireApiRoleContext("payroll");
    const { resultId } = await context.params;
    const data = await getPayrollResultDetail(resultId);
    if (!data) return errorResponse("PAYROLL_RESULT_NOT_FOUND", "The payroll result could not be found.", 404);
    const response: ApiSuccessResponse<typeof data> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    if (error instanceof PayrollResultDataError) return errorResponse(error.code, error.message, 500);
    if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
      return errorResponse("FIREBASE_UNAVAILABLE", "Payroll result data is temporarily unavailable.", 503);
    }
    return errorResponse("PAYROLL_RESULT_UNAVAILABLE", "Payroll result details are temporarily unavailable.", 503);
  }
}
