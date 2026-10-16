import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import {
  evaluateAccountingEligibility,
} from "@/server/accounting/accounting-preparation.service";
import { PayrollResultDataError } from "@/server/repositories/payroll-results/payroll-result.repository";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: { code, message },
    },
    { status },
  );
}

function mapError(error: unknown) {
  if (error instanceof ApiAuthorizationError) {
    return errorResponse(error.code, error.message, error.status);
  }
  if (error instanceof PayrollResultDataError) {
    return errorResponse(
      "ACCOUNTING_ELIGIBILITY_UNAVAILABLE",
      "Payroll Result data is temporarily unavailable.",
      503,
    );
  }
  if (error instanceof FirebaseAdminConfigurationError
    || error instanceof FirebaseAdminInitializationError) {
    return errorResponse(
      "FIREBASE_UNAVAILABLE",
      "Accounting eligibility is temporarily unavailable.",
      503,
    );
  }
  return errorResponse(
    "ACCOUNTING_ELIGIBILITY_UNAVAILABLE",
    "Accounting eligibility is temporarily unavailable.",
    503,
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ resultId: string }> },
) {
  try {
    const authContext = await requireApiRoleContext("accounting");
    await requireApiPermission("accounting.transfer.view", authContext.user);
    const { resultId } = await context.params;
    const eligibility = await evaluateAccountingEligibility({
      payrollResultId: resultId,
      actor: authContext.user,
    });

    if (!eligibility.payrollResult) {
      return errorResponse(
        "PAYROLL_RESULT_NOT_FOUND",
        "The Payroll Result could not be found.",
        404,
      );
    }

    return NextResponse.json<ApiSuccessResponse<typeof eligibility>>({
      success: true,
      data: eligibility,
    });
  } catch (error) {
    return mapError(error);
  }
}
