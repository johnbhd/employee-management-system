import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import {
  AccountingTransferDataError,
  getAccountingTransferDetail,
} from "@/server/accounting/accounting-transfer.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

function mapError(error: unknown) {
  if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
  if (error instanceof AccountingTransferDataError) return errorResponse(error.code, "Accounting transfer data is invalid.", 503);
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Accounting transfer data is temporarily unavailable.", 503);
  }
  return errorResponse("ACCOUNTING_TRANSFER_UNAVAILABLE", "Accounting transfer data is temporarily unavailable.", 503);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ transferId: string }> },
) {
  try {
    const authContext = await requireApiRoleContext("accounting");
    await requireApiPermission("accounting.transfer.view", authContext.user);
    const { transferId } = await context.params;
    const transfer = await getAccountingTransferDetail(transferId);
    if (!transfer) return errorResponse("ACCOUNTING_TRANSFER_NOT_FOUND", "The Accounting transfer could not be found.", 404);
    return NextResponse.json<ApiSuccessResponse<typeof transfer>>({ success: true, data: transfer });
  } catch (error) {
    return mapError(error);
  }
}

// End of protected Accounting transfer detail route.
