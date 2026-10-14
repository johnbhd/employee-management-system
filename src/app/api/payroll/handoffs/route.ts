import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { isPayrollDateKey } from "@/server/payroll/payroll-batches.service";
import {
  getDefaultPayrollHandoffQuery,
  getPayrollHandoffData,
  PayrollHandoffIntegrationError,
  PayrollHandoffValidationError,
  PayrollResultConflictError,
  PayrollResultDataError,
  PayrollResultValidationError,
  submitPayrollHandoff,
} from "@/server/payroll/payroll-handoff.service";
import {
  ApiAuthorizationError,
  requireApiPermission,
  requireApiRoleContext,
} from "@/server/auth/guards";
import {
  PayrollBatchConflictError,
  PayrollBatchDataError,
  PayrollBatchNotFoundError,
  PayrollBatchValidationError,
} from "@/server/repositories/payroll-batches/payroll-batch.repository";
import {
  PayrollHandoffConflictError,
  PayrollHandoffDataError,
} from "@/server/repositories/payroll-handoffs/payroll-handoff.repository";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { PayrollHandoffData, PayrollHandoffRecord, PayrollTransferStatus } from "@/types/payroll-handoff";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

function mapError(error: unknown) {
  if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
  if (error instanceof PayrollHandoffConflictError) return errorResponse(error.code, error.message, 409);
  if (error instanceof PayrollBatchConflictError) return errorResponse(error.code, error.message, 409);
  if (error instanceof PayrollHandoffValidationError) return errorResponse(error.code, error.message, 422);
  if (error instanceof PayrollBatchValidationError) return errorResponse(error.code, error.message, 422);
  if (error instanceof PayrollBatchNotFoundError) return errorResponse(error.code, error.message, 404);
  if (error instanceof PayrollHandoffIntegrationError) return errorResponse(error.code, error.message, 502);
  if (error instanceof PayrollResultConflictError) return errorResponse(error.code, error.message, 409);
  if (error instanceof PayrollResultValidationError) return errorResponse(error.code, error.message, 502);
  if (error instanceof PayrollResultDataError) return errorResponse(error.code, error.message, 500);
  if (error instanceof PayrollHandoffDataError) return errorResponse(error.code, error.message, 500);
  if (error instanceof PayrollBatchDataError) return errorResponse(error.code, error.message, 500);
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Payroll handoff data is temporarily unavailable.", 503);
  }
  return errorResponse("PAYROLL_HANDOFF_UNAVAILABLE", "Payroll handoff data is temporarily unavailable.", 503);
}

function getDateParam(value: string | null) {
  if (!value) return null;
  return isPayrollDateKey(value) ? value : "invalid";
}

function getQuery(request: Request) {
  const params = new URL(request.url).searchParams;
  const defaults = getDefaultPayrollHandoffQuery();
  const rawPage = Number(params.get("page") ?? defaults.page);
  const rawPageSize = Number(params.get("pageSize") ?? defaults.pageSize);
  const transferStatus = params.get("transferStatus");
  const allowedStatuses: PayrollTransferStatus[] = ["preparing", "submitting", "submitted", "failed"];

  if (!Number.isInteger(rawPage) || rawPage < 1 || !Number.isInteger(rawPageSize) || rawPageSize < 1 || rawPageSize > 50) {
    throw new PayrollHandoffValidationError("The handoff pagination values are invalid.");
  }
  if (transferStatus && !allowedStatuses.includes(transferStatus as PayrollTransferStatus)) {
    throw new PayrollHandoffValidationError("The handoff transfer status filter is invalid.");
  }

  return {
    search: params.get("search")?.trim() ?? "",
    periodStart: getDateParam(params.get("periodStart")),
    transferStatus: transferStatus as PayrollTransferStatus | null,
    fromDate: getDateParam(params.get("fromDate")),
    toDate: getDateParam(params.get("toDate")),
    page: rawPage,
    pageSize: rawPageSize,
  };
}

export async function GET(request: Request) {
  try {
    const context = await requireApiRoleContext("payroll");
    await requireApiPermission("payroll.handoff.view", context.user);
    const query = getQuery(request);
    if ([query.periodStart, query.fromDate, query.toDate].includes("invalid")) {
      return errorResponse("PAYROLL_HANDOFF_QUERY_INVALID", "One or more handoff date filters are invalid.", 400);
    }
    const data = await getPayrollHandoffData(query);
    const response: ApiSuccessResponse<PayrollHandoffData> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    return mapError(error);
  }
}

export async function POST(request: Request) {
  let context: Awaited<ReturnType<typeof requireApiRoleContext>>;
  try {
    context = await requireApiRoleContext("payroll");
    await requireApiPermission("payroll.handoff.submit", context.user);
  } catch (error) {
    return mapError(error);
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const batchId = typeof body.batchId === "string" ? body.batchId.trim() : "";
    if (!batchId) return errorResponse("PAYROLL_HANDOFF_BATCH_INVALID", "A batch ID is required.", 400);

    const handoff = await submitPayrollHandoff({ batchId, actor: context.user });
    const response: ApiSuccessResponse<PayrollHandoffRecord> = {
      success: true,
      data: {
        transferId: handoff.transferId,
        batchId: handoff.batchId,
        period: handoff.period,
        submittedBy: handoff.submittedBy,
        submittedAt: handoff.submittedAt,
        readyAt: handoff.readyAt,
        acknowledgedAt: handoff.acknowledgedAt,
        failedAt: handoff.failedAt,
        transferStatus: handoff.transferStatus,
        acknowledgementStatus: handoff.acknowledgementStatus,
        externalReference: handoff.externalReference,
        provider: handoff.provider,
        failureCode: handoff.failureCode,
        failureSummary: handoff.failureSummary,
        attemptCount: handoff.attemptCount,
        createdAt: handoff.createdAt,
        updatedAt: handoff.updatedAt,
        batchSummary: handoff.batchSummary,
        timeline: handoff.timeline,
      },
    };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return mapError(error);
  }
}
