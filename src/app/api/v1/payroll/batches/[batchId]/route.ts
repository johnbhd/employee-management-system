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
  PayrollBatchValidationError,
  updatePayrollBatchStatus,
} from "@/server/repositories/payroll-batches/payroll-batch.repository";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { PayrollBatchRecord } from "@/types/payroll-batches";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ batchId: string }> };

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

function mapError(error: unknown) {
  if (error instanceof PayrollBatchConflictError) return errorResponse(error.code, error.message, 409);
  if (error instanceof PayrollBatchValidationError) return errorResponse(error.code, error.message, 400);
  if (error instanceof PayrollBatchNotFoundError) return errorResponse(error.code, error.message, 404);
  if (error instanceof PayrollBatchDataError) return errorResponse(error.code, error.message, 500);
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Payroll batch data is temporarily unavailable.", 503);
  }
  return errorResponse("PAYROLL_BATCH_UNAVAILABLE", "The payroll batch could not be updated.", 503);
}

export async function PATCH(request: Request, context: RouteContext) {
  let authContext: Awaited<ReturnType<typeof requireApiRoleContext>>;
  try {
    authContext = await requireApiRoleContext("payroll");
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    return mapError(error);
  }

  try {
    const { batchId } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const status = body.status === "Ready" ? body.status : null;
    if (!status) return errorResponse("PAYROLL_BATCH_STATUS_INVALID", "A valid next batch status is required.", 400);

    const data = await updatePayrollBatchStatus({
      batchId,
      status,
      actor: authContext.user,
    });
    const response: ApiSuccessResponse<PayrollBatchRecord> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    return mapError(error);
  }
}
