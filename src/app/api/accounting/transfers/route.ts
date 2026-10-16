import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import {
  AccountingTransferConflictError,
  AccountingTransferDataError,
  AccountingTransferUnavailableError,
  AccountingTransferValidationError,
  getAccountingIntegrationStatusData,
  getDefaultAccountingIntegrationStatusQuery,
} from "@/server/accounting/accounting-transfer.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import {
  accountingTransferStatuses,
  type AccountingIntegrationStatusData,
  type AccountingTransferStatus,
} from "@/types/accounting-transfers";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

function mapError(error: unknown) {
  if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
  if (error instanceof AccountingTransferValidationError) return errorResponse(error.code, error.message, 400);
  if (error instanceof AccountingTransferConflictError) return errorResponse(error.code, error.message, 409);
  if (error instanceof AccountingTransferUnavailableError) return errorResponse(error.code, error.message, 503);
  if (error instanceof AccountingTransferDataError) return errorResponse(error.code, "Accounting transfer data is invalid.", 503);
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Accounting transfer data is temporarily unavailable.", 503);
  }
  return errorResponse("ACCOUNTING_TRANSFER_UNAVAILABLE", "Accounting transfer data is temporarily unavailable.", 503);
}

function parseStatus(value: string | null): AccountingTransferStatus | null {
  return value && accountingTransferStatuses.includes(value as AccountingTransferStatus)
    ? value as AccountingTransferStatus
    : null;
}

export async function GET(request: Request) {
  try {
    const context = await requireApiRoleContext("accounting");
    await requireApiPermission("accounting.transfer.view", context.user);
    const params = new URL(request.url).searchParams;
    const defaults = getDefaultAccountingIntegrationStatusQuery();
    const page = Number(params.get("page") ?? defaults.page);
    const pageSize = Number(params.get("pageSize") ?? defaults.pageSize);
    const rawStatus = params.get("transferStatus");
    const transferStatus = parseStatus(rawStatus);

    if (
      !Number.isInteger(page) || page < 1
      || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50
      || (rawStatus && !transferStatus)
    ) {
      return errorResponse("ACCOUNTING_TRANSFER_QUERY_INVALID", "The Accounting transfer filters are invalid.", 400);
    }

    const data = await getAccountingIntegrationStatusData({
      search: params.get("search")?.trim() ?? "",
      transferStatus,
      page,
      pageSize,
    });
    const response: ApiSuccessResponse<AccountingIntegrationStatusData> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    return mapError(error);
  }
}

export async function POST(_request: Request) {
  try {
    const context = await requireApiRoleContext("accounting");
    await requireApiPermission("accounting.transfer.submit", context.user);
    return errorResponse(
      "ACCOUNTING_SUBMISSION_NOT_AVAILABLE",
      "External Accounting submission belongs to ACCOUNTING-017B and is not available during local preparation.",
      409,
    );
  } catch (error) {
    return mapError(error);
  }
}

// End of protected Accounting transfer collection route.
