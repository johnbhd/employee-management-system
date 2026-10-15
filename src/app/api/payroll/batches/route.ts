import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { requireApiPermission, requireApiRoleContext, ApiAuthorizationError } from "@/server/auth/guards";
import {
  addPayrollBatchItem,
  createPayrollBatch,
  PayrollBatchConflictError,
  PayrollBatchDataError,
  PayrollBatchEligibilityError,
  PayrollBatchNotFoundError,
  PayrollBatchValidationError,
} from "@/server/repositories/payroll-batches/payroll-batch.repository";
import {
  createPayrollPeriod,
  getDefaultPayrollBatchesQuery,
  getPayrollBatchesData,
  toPayrollBatchSnapshot,
} from "@/server/payroll/payroll-batches.service";
import { getPayrollVerifiedAttendanceSourcesForPeriod } from "@/server/payroll/payroll-verified-attendance.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { PayrollBatchRecord, PayrollBatchesData } from "@/types/payroll-batches";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
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
  return errorResponse("PAYROLL_BATCHES_UNAVAILABLE", "Payroll batches are temporarily unavailable.", 503);
}

function getPeriodQuery(request: Request) {
  const params = new URL(request.url).searchParams;
  const defaults = getDefaultPayrollBatchesQuery();
  return {
    periodStart: params.get("periodStart")?.trim() || defaults.periodStart,
    periodEnd: params.get("periodEnd")?.trim() || defaults.periodEnd,
  };
}

export async function GET(request: Request) {
  try {
    const context = await requireApiRoleContext("payroll");
    await requireApiPermission("payroll.batch.view", context.user);
    const data = await getPayrollBatchesData(getPeriodQuery(request));
    const response: ApiSuccessResponse<PayrollBatchesData> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    return mapError(error);
  }
}

export async function POST(request: Request) {
  let context: Awaited<ReturnType<typeof requireApiRoleContext>>;

  try {
    context = await requireApiRoleContext("payroll");
    await requireApiPermission("payroll.batch.manage", context.user);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
    return mapError(error);
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const periodStart = typeof body.periodStart === "string" ? body.periodStart.trim() : "";
    const periodEnd = typeof body.periodEnd === "string" ? body.periodEnd.trim() : "";
    const period = createPayrollPeriod(periodStart, periodEnd);
    const notes = typeof body.notes === "string" ? body.notes : null;
    const employeePeriodIds = Array.isArray(body.employeePeriodIds)
      ? body.employeePeriodIds.filter((value): value is string => typeof value === "string")
      : [];
    const sources = await getPayrollVerifiedAttendanceSourcesForPeriod(period);
    const batch = await createPayrollBatch({
      period,
      actor: context.user,
      notes,
      blockedCount: sources.filter(({ item }) => item.payrollReadiness.status === "blocked").length,
    });

    if (employeePeriodIds.length === 0) {
      const response: ApiSuccessResponse<PayrollBatchRecord> = { success: true, data: batch };
      return NextResponse.json(response, { status: 201 });
    }

    const sourceById = new Map(sources.map((source) => [source.item.id, source]));
    let updatedBatch = batch;

    for (const employeePeriodId of employeePeriodIds) {
      const source = sourceById.get(employeePeriodId);
      if (!source || source.item.payrollReadiness.status !== "ready") {
        throw new PayrollBatchEligibilityError("Only Ready for Payroll records can be added to a batch.");
      }

      updatedBatch = await addPayrollBatchItem({
        batchId: updatedBatch.id,
        snapshot: toPayrollBatchSnapshot(source),
        actor: context.user,
      });
    }

    const response: ApiSuccessResponse<PayrollBatchRecord> = { success: true, data: updatedBatch };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return mapError(error);
  }
}
