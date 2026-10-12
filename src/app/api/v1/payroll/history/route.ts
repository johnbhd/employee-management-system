import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiRoleContext } from "@/server/auth/guards";
import { isPayrollDateKey } from "@/server/payroll/payroll-batches.service";
import {
  getDefaultPayrollHistoryQuery,
  getPayrollHistoryData,
  PayrollHistoryValidationError,
} from "@/server/payroll/payroll-history.service";
import type { PayrollBatchStatus } from "@/types/payroll-batches";
import type {
  PayrollAcknowledgementStatus,
  PayrollTransferStatus,
} from "@/types/payroll-handoff";
import type { PayrollResultStatus } from "@/types/payroll-results";
import { payrollBatchStatuses } from "@/types/payroll-batches";
import { payrollAcknowledgementStatuses, payrollTransferStatuses } from "@/types/payroll-handoff";
import { payrollResultStatuses } from "@/types/payroll-results";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { PayrollHistoryData } from "@/types/payroll-history";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

function parseAllowedValue<T extends string>(value: string | null, allowed: readonly T[]) {
  return value && allowed.includes(value as T) ? value as T : null;
}

function mapError(error: unknown) {
  if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
  if (error instanceof PayrollHistoryValidationError) return errorResponse(error.code, error.message, 400);
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Payroll history data is temporarily unavailable.", 503);
  }
  return errorResponse("PAYROLL_HISTORY_UNAVAILABLE", "Payroll history data is temporarily unavailable.", 503);
}

export async function GET(request: Request) {
  try {
    await requireApiRoleContext("payroll");
    const params = new URL(request.url).searchParams;
    const defaults = getDefaultPayrollHistoryQuery();
    const rawPage = Number(params.get("page") ?? defaults.page);
    const rawPageSize = Number(params.get("pageSize") ?? defaults.pageSize);
    const periodStart = params.get("periodStart")?.trim() || null;
    const fromDate = params.get("fromDate")?.trim() || null;
    const toDate = params.get("toDate")?.trim() || null;
    const batchStatus = parseAllowedValue<PayrollBatchStatus>(params.get("batchStatus"), payrollBatchStatuses);
    const transferStatus = parseAllowedValue<PayrollTransferStatus>(params.get("transferStatus"), payrollTransferStatuses);
    const acknowledgementStatus = parseAllowedValue<PayrollAcknowledgementStatus>(params.get("acknowledgementStatus"), payrollAcknowledgementStatuses);
    const resultStatus = parseAllowedValue<PayrollResultStatus>(params.get("resultStatus"), payrollResultStatuses);
    const rawBatchStatus = params.get("batchStatus");
    const rawTransferStatus = params.get("transferStatus");
    const rawAcknowledgementStatus = params.get("acknowledgementStatus");
    const rawResultStatus = params.get("resultStatus");

    if (!Number.isInteger(rawPage) || rawPage < 1 || !Number.isInteger(rawPageSize) || rawPageSize < 1 || rawPageSize > 50) {
      return errorResponse("PAYROLL_HISTORY_QUERY_INVALID", "The payroll history pagination values are invalid.", 400);
    }
    if ((rawBatchStatus && !batchStatus)
      || (rawTransferStatus && !transferStatus)
      || (rawAcknowledgementStatus && !acknowledgementStatus)
      || (rawResultStatus && !resultStatus)) {
      return errorResponse("PAYROLL_HISTORY_QUERY_INVALID", "One or more payroll history status filters are invalid.", 400);
    }
    if ((periodStart && !isPayrollDateKey(periodStart))
      || (fromDate && !isPayrollDateKey(fromDate))
      || (toDate && !isPayrollDateKey(toDate))) {
      return errorResponse("PAYROLL_HISTORY_QUERY_INVALID", "One or more payroll history dates are invalid.", 400);
    }

    const data = await getPayrollHistoryData({
      search: params.get("search")?.trim() ?? "",
      periodStart,
      batchStatus,
      transferStatus,
      acknowledgementStatus,
      resultStatus,
      fromDate,
      toDate,
      page: rawPage,
      pageSize: rawPageSize,
    });
    const response: ApiSuccessResponse<PayrollHistoryData> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    return mapError(error);
  }
}
