import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { getAccountingDashboardData } from "@/server/accounting/accounting-dashboard.service";
import {
  AccountingTransferDataError,
} from "@/server/repositories/accounting-transfers/accounting-transfer.repository";
import { PayrollResultDataError } from "@/server/repositories/payroll-results/payroll-result.repository";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { AccountingDashboardData } from "@/types/accounting-dashboard";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

export async function GET() {
  try {
    const context = await requireApiRoleContext("accounting");
    await requireApiPermission("accounting.dashboard.view", context.user);
    const data = await getAccountingDashboardData();
    const response: ApiSuccessResponse<AccountingDashboardData> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return errorResponse(error.code, error.message, error.status);
    }

    if (
      error instanceof FirebaseAdminConfigurationError
      || error instanceof FirebaseAdminInitializationError
    ) {
      return errorResponse(
        "FIREBASE_UNAVAILABLE",
        "Accounting dashboard data is temporarily unavailable.",
        503,
      );
    }

    if (
      error instanceof AccountingTransferDataError
      || error instanceof PayrollResultDataError
    ) {
      return errorResponse(
        "ACCOUNTING_DASHBOARD_DATA_INVALID",
        "Accounting dashboard data is invalid.",
        503,
      );
    }

    return errorResponse(
      "ACCOUNTING_DASHBOARD_UNAVAILABLE",
      "Accounting dashboard data is temporarily unavailable.",
      503,
    );
  }
}
