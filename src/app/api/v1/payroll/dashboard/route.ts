import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { getPayrollDashboardData } from "@/server/payroll/payroll-dashboard.service";
import {
  ApiAuthorizationError,
  requireApiPermission,
  requireApiRoleContext,
} from "@/server/auth/guards";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { PayrollDashboardData } from "@/types/payroll-dashboard";

export const runtime = "nodejs";

function getErrorResponse(
  code: string,
  message: string,
  status: number,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
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

export async function GET() {
  try {
    const context = await requireApiRoleContext("payroll");
    await requireApiPermission("payroll.dashboard.view", context.user);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return getErrorResponse(error.code, error.message, error.status);
    }

    return getErrorResponse(
      "PAYROLL_DASHBOARD_UNAVAILABLE",
      "The Payroll Dashboard is temporarily unavailable.",
      503,
    );
  }

  try {
    const data = await getPayrollDashboardData();
    const response: ApiSuccessResponse<PayrollDashboardData> = {
      success: true,
      data,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (
      error instanceof FirebaseAdminConfigurationError
      || error instanceof FirebaseAdminInitializationError
    ) {
      return getErrorResponse(
        "FIREBASE_UNAVAILABLE",
        "The Payroll Dashboard is temporarily unavailable.",
        503,
      );
    }

    return getErrorResponse(
      "PAYROLL_DASHBOARD_UNAVAILABLE",
      "The Payroll Dashboard is temporarily unavailable.",
      503,
    );
  }
}
