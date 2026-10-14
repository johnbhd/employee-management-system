import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { isPayrollDateKey } from "@/server/payroll/payroll-batches.service";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import {
  AccountingTransferDataError,
  AccountingTransactionHistoryValidationError,
  getAccountingTransactionHistoryData,
  getDefaultAccountingTransactionHistoryQuery,
  PayrollResultDataError,
} from "@/server/accounting/accounting-transaction-history.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import {
  accountingAcknowledgementStatuses,
  accountingTransferStatuses,
  type AccountingAcknowledgementStatus,
  type AccountingTransferStatus,
} from "@/types/accounting-transfers";
import type { AccountingTransactionHistoryData } from "@/types/accounting-transaction-history";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

function parseAllowedValue<T extends string>(value: string | null, allowed: readonly T[]) {
  return value && allowed.includes(value as T) ? value as T : null;
}

function mapError(error: unknown) {
  if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
  if (error instanceof AccountingTransactionHistoryValidationError) {
    return errorResponse(error.code, error.message, 400);
  }
  if (error instanceof AccountingTransferDataError || error instanceof PayrollResultDataError) {
    return errorResponse("ACCOUNTING_TRANSACTION_HISTORY_DATA_INVALID", "Accounting transaction history data is invalid.", 503);
  }
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Accounting transaction history is temporarily unavailable.", 503);
  }
  return errorResponse(
    "ACCOUNTING_TRANSACTION_HISTORY_UNAVAILABLE",
    "Accounting transaction history is temporarily unavailable.",
    503,
  );
}

export async function GET(request: Request) {
  try {
    const context = await requireApiRoleContext("accounting");
    await requireApiPermission("accounting.history.view", context.user);
    const params = new URL(request.url).searchParams;
    const defaults = getDefaultAccountingTransactionHistoryQuery();
    const page = Number(params.get("page") ?? defaults.page);
    const pageSize = Number(params.get("pageSize") ?? defaults.pageSize);
    const periodStart = params.get("periodStart")?.trim() || null;
    const rawTransferStatus = params.get("transferStatus");
    const rawAcknowledgementStatus = params.get("acknowledgementStatus");
    const transferStatus = parseAllowedValue<AccountingTransferStatus>(
      rawTransferStatus,
      accountingTransferStatuses,
    );
    const acknowledgementStatus = parseAllowedValue<AccountingAcknowledgementStatus>(
      rawAcknowledgementStatus,
      accountingAcknowledgementStatuses,
    );

    if (
      !Number.isInteger(page) || page < 1
      || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50
      || (rawTransferStatus && !transferStatus)
      || (rawAcknowledgementStatus && !acknowledgementStatus)
      || (periodStart && !isPayrollDateKey(periodStart))
    ) {
      return errorResponse(
        "ACCOUNTING_TRANSACTION_HISTORY_QUERY_INVALID",
        "The Accounting transaction history filters are invalid.",
        400,
      );
    }

    const data = await getAccountingTransactionHistoryData({
      search: params.get("search")?.trim() ?? "",
      periodStart,
      transferStatus,
      acknowledgementStatus,
      page,
      pageSize,
    });
    const response: ApiSuccessResponse<AccountingTransactionHistoryData> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    return mapError(error);
  }
}
