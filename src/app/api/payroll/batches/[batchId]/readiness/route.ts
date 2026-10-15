import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import {
  ApiAuthorizationError,
  requireApiPermission,
  requireApiRoleContext,
} from "@/server/auth/guards";
import {
  getPayrollBatchReadiness,
  PayrollBatchDataError,
  PayrollBatchNotFoundError,
} from "@/server/repositories/payroll-batches/payroll-batch.repository";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { PayrollBatchReadiness } from "@/types/payroll-batches";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ batchId: string }> };

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

function mapError(error: unknown) {
  if (error instanceof ApiAuthorizationError) {
    return errorResponse(error.code, error.message, error.status);
  }
  if (error instanceof PayrollBatchNotFoundError) {
    return errorResponse(error.code, error.message, 404);
  }
  if (error instanceof PayrollBatchDataError) {
    return errorResponse(error.code, error.message, 500);
  }
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse(
      "FIREBASE_UNAVAILABLE",
      "Payroll batch readiness is temporarily unavailable.",
      503,
    );
  }
  return errorResponse(
    "PAYROLL_BATCH_READINESS_UNAVAILABLE",
    "Payroll batch readiness could not be evaluated.",
    503,
  );
}

async function evaluate(
  context: RouteContext,
  permission: "payroll.batch.view" | "payroll.batch.manage",
) {
  try {
    const authContext = await requireApiRoleContext("payroll");
    await requireApiPermission(permission, authContext.user);
    const { batchId } = await context.params;
    const data = await getPayrollBatchReadiness(batchId);
    const response: ApiSuccessResponse<PayrollBatchReadiness> = {
      success: true,
      data,
    };
    return NextResponse.json(response);
  } catch (error) {
    return mapError(error);
  }
}

export async function GET(request: Request, context: RouteContext) {
  void request;
  return evaluate(context, "payroll.batch.view");
}

export async function POST(request: Request, context: RouteContext) {
  void request;
  return evaluate(context, "payroll.batch.manage");
}
