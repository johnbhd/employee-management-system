import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { requireApiRoleContext, ApiAuthorizationError } from "@/server/auth/guards";
import {
  PayrollBatchConflictError,
  PayrollBatchDataError,
  PayrollBatchNotFoundError,
  removePayrollBatchItem,
} from "@/server/repositories/payroll-batches/payroll-batch.repository";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { PayrollBatchRecord } from "@/types/payroll-batches";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ batchId: string; employeePeriodId: string }> };

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

function mapError(error: unknown) {
  if (error instanceof PayrollBatchConflictError) return errorResponse(error.code, error.message, 409);
  if (error instanceof PayrollBatchNotFoundError) return errorResponse(error.code, error.message, 404);
  if (error instanceof PayrollBatchDataError) return errorResponse(error.code, error.message, 500);
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Payroll batch data is temporarily unavailable.", 503);
  }
  return errorResponse("PAYROLL_BATCH_ITEMS_UNAVAILABLE", "Payroll batch records are temporarily unavailable.", 503);
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireApiRoleContext("payroll");
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    return mapError(error);
  }

  try {
    const { batchId, employeePeriodId } = await context.params;
    const data = await removePayrollBatchItem({
      batchId,
      employeePeriodId: decodeURIComponent(employeePeriodId),
    });
    const response: ApiSuccessResponse<PayrollBatchRecord> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    return mapError(error);
  }
}
