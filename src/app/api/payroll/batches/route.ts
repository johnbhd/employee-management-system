import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { requireApiPermission, requireApiRoleContext, ApiAuthorizationError } from "@/server/auth/guards";
import {
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
  isPayrollDateKey,
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

function getErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return {
      errorName: typeof error,
      errorMessage: String(error),
      errorCode: null,
      errorStack: null,
    };
  }

  const candidate = error as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    stack?: unknown;
  };

  return {
    errorName: typeof candidate.name === "string" ? candidate.name : "UnknownError",
    errorMessage: typeof candidate.message === "string" ? candidate.message : "Unknown error",
    errorCode: typeof candidate.code === "string" ? candidate.code : null,
    errorStack: typeof candidate.stack === "string" ? candidate.stack : null,
  };
}

function logPostError(
  error: unknown,
  input: {
    periodStart?: string;
    periodEnd?: string;
    employeePeriodIds?: readonly string[];
  } = {},
) {
  const details = getErrorDetails(error);

  console.error(
    "[payroll.batch.create] failed",
    JSON.stringify({
      operation: "POST /api/payroll/batches",
      periodStart: input.periodStart ?? null,
      periodEnd: input.periodEnd ?? null,
      selectedRecordCount: input.employeePeriodIds?.length ?? 0,
      selectedEmployeePeriodIds: input.employeePeriodIds ?? [],
      ...details,
    }),
  );
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
    logPostError(error);
    return mapError(error);
  }

  let diagnosticInput: {
    periodStart?: string;
    periodEnd?: string;
    employeePeriodIds?: readonly string[];
  } = {};

  try {
    const body = await request.json() as Record<string, unknown>;
    const periodStart = typeof body.periodStart === "string" ? body.periodStart.trim() : "";
    const periodEnd = typeof body.periodEnd === "string" ? body.periodEnd.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes : null;
    const rawEmployeePeriodIds = body.employeePeriodIds;
    if (
      rawEmployeePeriodIds !== undefined
      && (!Array.isArray(rawEmployeePeriodIds)
        || rawEmployeePeriodIds.some((value) => typeof value !== "string" || !value.trim()))
    ) {
      return errorResponse(
        "PAYROLL_BATCH_VALIDATION_ERROR",
        "Selected employee-period records must be valid identifiers.",
        400,
      );
    }

    if (!isPayrollDateKey(periodStart) || !isPayrollDateKey(periodEnd) || periodStart > periodEnd) {
      return errorResponse(
        "PAYROLL_BATCH_VALIDATION_ERROR",
        "A valid payroll period is required.",
        400,
      );
    }

    const employeePeriodIds = Array.from(new Set(
      (Array.isArray(rawEmployeePeriodIds) ? rawEmployeePeriodIds : [])
        .map((value) => value.trim()),
    ));
    diagnosticInput = { periodStart, periodEnd, employeePeriodIds };
    const period = createPayrollPeriod(periodStart, periodEnd);
    const sources = await getPayrollVerifiedAttendanceSourcesForPeriod(period);
    const sourceById = new Map(sources.map((source) => [source.item.id, source]));
    const selectedSources = employeePeriodIds.map((employeePeriodId) => {
      const source = sourceById.get(employeePeriodId);
      if (!source || source.item.payrollReadiness.status !== "ready") {
        throw new PayrollBatchEligibilityError("Only Ready for Payroll records can be added to a batch.");
      }

      try {
        return {
          source,
          snapshot: toPayrollBatchSnapshot(source),
        };
      } catch {
        throw new PayrollBatchEligibilityError("Payroll eligibility changed. Refresh verified attendance before adding this record.");
      }
    });
    const batch = await createPayrollBatch({
      period,
      actor: context.user,
      notes,
      // Draft batches contain only selected Ready records. Keep the persisted
      // count valid until a batch item exists and readiness is recalculated.
      blockedCount: 0,
      items: selectedSources.map(({ source, snapshot }) => ({
        ...snapshot,
        employeeInternalId: source.employeeInternalId,
      })),
    });

    const response: ApiSuccessResponse<PayrollBatchRecord> = { success: true, data: batch };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    logPostError(error, diagnosticInput);
    return mapError(error);
  }
}
