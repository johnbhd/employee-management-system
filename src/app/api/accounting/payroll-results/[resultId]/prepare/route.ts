import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import {
  AccountingEligibilityBlockedError,
  prepareAccountingTransfer,
} from "@/server/accounting/accounting-preparation.service";
import {
  AccountingTransferConflictError,
  AccountingTransferDataError,
  AccountingTransferNotFoundError,
} from "@/server/repositories/accounting-transfers/accounting-transfer.repository";
import { PayrollResultDataError } from "@/server/repositories/payroll-results/payroll-result.repository";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";

export const runtime = "nodejs";

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown,
) {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    { status },
  );
}

function mapError(error: unknown) {
  if (error instanceof ApiAuthorizationError) {
    return errorResponse(error.code, error.message, error.status);
  }
  if (error instanceof AccountingEligibilityBlockedError) {
    return errorResponse(
      error.code,
      "The Payroll Result is blocked from Accounting preparation.",
      422,
      error.eligibility,
    );
  }
  if (error instanceof AccountingTransferConflictError) {
    return errorResponse(error.code, error.message, 409);
  }
  if (error instanceof AccountingTransferNotFoundError) {
    return errorResponse(error.code, error.message, 404);
  }
  if (error instanceof AccountingTransferDataError || error instanceof PayrollResultDataError) {
    return errorResponse(
      "ACCOUNTING_PREPARATION_UNAVAILABLE",
      "Accounting preparation data is temporarily unavailable.",
      503,
    );
  }
  if (error instanceof FirebaseAdminConfigurationError
    || error instanceof FirebaseAdminInitializationError) {
    return errorResponse(
      "FIREBASE_UNAVAILABLE",
      "Accounting preparation is temporarily unavailable.",
      503,
    );
  }
  return errorResponse(
    "ACCOUNTING_PREPARATION_UNAVAILABLE",
    "Accounting preparation is temporarily unavailable.",
    503,
  );
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ resultId: string }> },
) {
  try {
    const authContext = await requireApiRoleContext("accounting");
    await requireApiPermission("accounting.transfer.prepare", authContext.user);
    const { resultId } = await context.params;
    const transfer = await prepareAccountingTransfer({
      payrollResultId: resultId,
      actor: authContext.user,
    });

    return NextResponse.json<ApiSuccessResponse<typeof transfer>>(
      { success: true, data: transfer },
      { status: 201 },
    );
  } catch (error) {
    return mapError(error);
  }
}
