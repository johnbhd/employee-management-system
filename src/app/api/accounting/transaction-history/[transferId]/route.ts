import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import {
  AccountingTransferDataError,
  getAccountingTransactionHistoryDetail,
  PayrollResultDataError,
} from "@/server/accounting/accounting-transaction-history.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { AccountingTransactionHistoryDetail } from "@/types/accounting-transaction-history";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

function mapError(error: unknown) {
  if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Accounting transaction history is temporarily unavailable.", 503);
  }
  if (error instanceof AccountingTransferDataError || error instanceof PayrollResultDataError) {
    return errorResponse("ACCOUNTING_TRANSACTION_HISTORY_DATA_INVALID", "Accounting transaction history data is invalid.", 503);
  }
  return errorResponse(
    "ACCOUNTING_TRANSACTION_HISTORY_UNAVAILABLE",
    "Accounting transaction history is temporarily unavailable.",
    503,
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ transferId: string }> },
) {
  try {
    const authContext = await requireApiRoleContext("accounting");
    await requireApiPermission("accounting.history.view", authContext.user);
    const { transferId } = await context.params;
    const detail = await getAccountingTransactionHistoryDetail(transferId);
    if (!detail) {
      return errorResponse(
        "ACCOUNTING_TRANSACTION_HISTORY_NOT_FOUND",
        "The Accounting transfer history record could not be found.",
        404,
      );
    }
    return NextResponse.json<ApiSuccessResponse<AccountingTransactionHistoryDetail>>({
      success: true,
      data: detail,
    });
  } catch (error) {
    return mapError(error);
  }
}
