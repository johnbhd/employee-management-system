import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { isPayrollDateKey } from "@/server/payroll/payroll-batches.service";
import {
  getDefaultPayrollResultsQuery,
  getPayrollResultsData,
  PayrollResultDataError,
  PayrollResultValidationError,
} from "@/server/payroll/payroll-result.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { PayrollResultProcessingStatus, PayrollResultsData } from "@/types/payroll-results";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

function mapError(error: unknown) {
  if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
  if (error instanceof PayrollResultValidationError) return errorResponse(error.code, error.message, 400);
  if (error instanceof PayrollResultDataError) return errorResponse(error.code, error.message, 500);
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Payroll result data is temporarily unavailable.", 503);
  }
  return errorResponse("PAYROLL_RESULTS_UNAVAILABLE", "Payroll result data is temporarily unavailable.", 503);
}

export async function GET(request: Request) {
  try {
    const context = await requireApiRoleContext("payroll");
    await requireApiPermission("payroll.result.view", context.user);
    const params = new URL(request.url).searchParams;
    const defaults = getDefaultPayrollResultsQuery();
    const rawPage = Number(params.get("page") ?? defaults.page);
    const rawPageSize = Number(params.get("pageSize") ?? defaults.pageSize);
    const rawStatus = params.get("status");
    const rawPeriodStart = params.get("periodStart")?.trim() || null;
    const statuses: PayrollResultProcessingStatus[] = ["processed", "pending", "rejected", "failed"];

    if (!Number.isInteger(rawPage) || rawPage < 1 || !Number.isInteger(rawPageSize) || rawPageSize < 1 || rawPageSize > 50) {
      return errorResponse("PAYROLL_RESULTS_QUERY_INVALID", "The payroll result pagination values are invalid.", 400);
    }
    if (rawStatus && !statuses.includes(rawStatus as PayrollResultProcessingStatus)) {
      return errorResponse("PAYROLL_RESULTS_QUERY_INVALID", "The payroll result status filter is invalid.", 400);
    }
    if (rawPeriodStart && !isPayrollDateKey(rawPeriodStart)) {
      return errorResponse("PAYROLL_RESULTS_QUERY_INVALID", "The payroll result period filter is invalid.", 400);
    }

    const data = await getPayrollResultsData({
      search: params.get("search")?.trim() ?? "",
      periodStart: rawPeriodStart,
      status: rawStatus as PayrollResultProcessingStatus | null,
      department: params.get("department")?.trim() || null,
      page: rawPage,
      pageSize: rawPageSize,
    });
    const response: ApiSuccessResponse<PayrollResultsData> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    return mapError(error);
  }
}
