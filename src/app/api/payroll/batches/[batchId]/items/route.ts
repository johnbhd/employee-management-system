import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { requireApiPermission, requireApiRoleContext, ApiAuthorizationError } from "@/server/auth/guards";
import {
  addPayrollBatchItem,
  PayrollBatchConflictError,
  PayrollBatchDataError,
  PayrollBatchEligibilityError,
  PayrollBatchNotFoundError,
  PayrollBatchValidationError,
  getPayrollBatchById,
} from "@/server/repositories/payroll-batches/payroll-batch.repository";
import {
  createPayrollPeriod,
  toPayrollBatchSnapshot,
} from "@/server/payroll/payroll-batches.service";
import { getPayrollVerifiedAttendanceSourcesForPeriod } from "@/server/payroll/payroll-verified-attendance.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { PayrollBatchRecord } from "@/types/payroll-batches";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ batchId: string }> };

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

function mapError(error: unknown) {
  if (error instanceof PayrollBatchConflictError) return errorResponse(error.code, error.message, 409);
  if (error instanceof PayrollBatchEligibilityError) return errorResponse(error.code, error.message, 422);
  if (error instanceof PayrollBatchValidationError) return errorResponse(error.code, error.message, 400);
  if (error instanceof PayrollBatchNotFoundError) return errorResponse(error.code, error.message, 404);
  if (error instanceof PayrollBatchDataError) return errorResponse(error.code, error.message, 500);
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Payroll batch data is temporarily unavailable.", 503);
  }
  return errorResponse("PAYROLL_BATCH_ITEMS_UNAVAILABLE", "Payroll batch records are temporarily unavailable.", 503);
}

export async function POST(request: Request, context: RouteContext) {
  let authContext: Awaited<ReturnType<typeof requireApiRoleContext>>;
  try {
    authContext = await requireApiRoleContext("payroll");
    await requireApiPermission("payroll.batch.manage", authContext.user);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    return mapError(error);
  }

  try {
    const { batchId } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const employeePeriodId = typeof body.employeePeriodId === "string" ? body.employeePeriodId : "";
    if (!employeePeriodId) return errorResponse("PAYROLL_BATCH_RECORD_INVALID", "An employee-period record is required.", 400);

    const [employeeId, periodStart] = employeePeriodId.split(":");
    if (!employeeId || !periodStart) return errorResponse("PAYROLL_BATCH_RECORD_INVALID", "The employee-period record is invalid.", 400);

    const batch = await getPayrollBatchById(batchId);
    if (!batch) {
      throw new PayrollBatchNotFoundError();
    }

    const payrollPeriod = createPayrollPeriod(batch.period.start, batch.period.end);
    const source = (await getPayrollVerifiedAttendanceSourcesForPeriod(payrollPeriod))
      .find((candidate) => candidate.item.id === employeePeriodId && candidate.item.employeeId === employeeId && candidate.item.payrollPeriod.start === periodStart);
    if (!source || source.item.payrollReadiness.status !== "ready") {
      throw new PayrollBatchEligibilityError("Only Ready for Payroll records can be added to a batch.");
    }

    const data = await addPayrollBatchItem({ batchId, snapshot: toPayrollBatchSnapshot(source), actor: authContext.user });
    const response: ApiSuccessResponse<PayrollBatchRecord> = { success: true, data };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return mapError(error);
  }
}
