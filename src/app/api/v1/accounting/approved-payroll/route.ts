import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiRoleContext } from "@/server/auth/guards";
import {
  getAccountingApprovedPayrollData,
  getDefaultAccountingApprovedPayrollQuery,
  AccountingApprovedPayrollValidationError,
  PayrollResultDataError,
} from "@/server/accounting/accounting-approved-payroll.service";
import { isPayrollDateKey } from "@/server/payroll/payroll-batches.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import {
  accountingReadinessStatuses,
  accountingTransferStatuses,
  type AccountingApprovedPayrollData,
  type AccountingReadinessStatus,
  type AccountingTransferStatus,
} from "@/types/accounting-approved-payroll";
import {
  payrollResultStatuses,
  type PayrollResultStatus,
} from "@/types/payroll-results";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

function mapError(error: unknown) {
  if (error instanceof ApiAuthorizationError) {
    return errorResponse(error.code, error.message, error.status);
  }

  if (error instanceof AccountingApprovedPayrollValidationError) {
    return errorResponse(error.code, error.message, 400);
  }

  if (error instanceof PayrollResultDataError) {
    return errorResponse(
      "ACCOUNTING_APPROVED_PAYROLL_UNAVAILABLE",
      "Approved payroll information is temporarily unavailable.",
      503,
    );
  }

  if (
    error instanceof FirebaseAdminConfigurationError
    || error instanceof FirebaseAdminInitializationError
  ) {
    return errorResponse(
      "FIREBASE_UNAVAILABLE",
      "Approved payroll information is temporarily unavailable.",
      503,
    );
  }

  return errorResponse(
    "ACCOUNTING_APPROVED_PAYROLL_UNAVAILABLE",
    "Approved payroll information is temporarily unavailable.",
    503,
  );
}

function parseAllowedValue<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | null {
  return value && allowed.includes(value as T) ? value as T : null;
}

export async function GET(request: Request) {
  try {
    await requireApiRoleContext("accounting");

    const params = new URL(request.url).searchParams;
    const defaults = getDefaultAccountingApprovedPayrollQuery();
    const rawPage = Number(params.get("page") ?? defaults.page);
    const rawPageSize = Number(params.get("pageSize") ?? defaults.pageSize);
    const periodStart = params.get("periodStart")?.trim() || null;
    const rawResultStatus = params.get("resultStatus");
    const rawReadinessStatus = params.get("readiness");
    const rawTransferStatus = params.get("transferStatus");
    const resultStatus = parseAllowedValue<PayrollResultStatus>(
      rawResultStatus,
      payrollResultStatuses,
    );
    const readinessStatus = parseAllowedValue<AccountingReadinessStatus>(
      rawReadinessStatus,
      accountingReadinessStatuses,
    );
    const transferStatus = parseAllowedValue<AccountingTransferStatus>(
      rawTransferStatus,
      accountingTransferStatuses,
    );

    if (
      !Number.isInteger(rawPage)
      || rawPage < 1
      || !Number.isInteger(rawPageSize)
      || rawPageSize < 1
      || rawPageSize > 50
    ) {
      return errorResponse(
        "ACCOUNTING_APPROVED_PAYROLL_QUERY_INVALID",
        "The approved payroll pagination values are invalid.",
        400,
      );
    }

    if (
      (rawResultStatus && !resultStatus)
      || (rawReadinessStatus && !readinessStatus)
      || (rawTransferStatus && !transferStatus)
    ) {
      return errorResponse(
        "ACCOUNTING_APPROVED_PAYROLL_QUERY_INVALID",
        "One or more approved payroll filters are invalid.",
        400,
      );
    }

    if (periodStart && !isPayrollDateKey(periodStart)) {
      return errorResponse(
        "ACCOUNTING_APPROVED_PAYROLL_QUERY_INVALID",
        "The approved payroll period filter is invalid.",
        400,
      );
    }

    const data = await getAccountingApprovedPayrollData({
      search: params.get("search")?.trim() ?? "",
      periodStart,
      resultStatus,
      readinessStatus,
      transferStatus,
      page: rawPage,
      pageSize: rawPageSize,
    });
    const response: ApiSuccessResponse<AccountingApprovedPayrollData> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    return mapError(error);
  }
}
