import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { requireApiRoleContext, ApiAuthorizationError } from "@/server/auth/guards";
import { parsePayrollVerifiedAttendanceQuery } from "@/server/payroll/payroll-verified-attendance-query";
import { getPayrollVerifiedAttendanceData } from "@/server/payroll/payroll-verified-attendance.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { PayrollVerifiedAttendanceData } from "@/types/payroll-verified-attendance";

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

export async function GET(request: Request) {
  try {
    await requireApiRoleContext("payroll");
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return getErrorResponse(error.code, error.message, error.status);
    }

    return getErrorResponse(
      "PAYROLL_VERIFIED_ATTENDANCE_UNAVAILABLE",
      "Verified attendance is temporarily unavailable.",
      503,
    );
  }

  const query = parsePayrollVerifiedAttendanceQuery(
    new URL(request.url).searchParams,
  );

  try {
    const data = await getPayrollVerifiedAttendanceData(query);
    const response: ApiSuccessResponse<PayrollVerifiedAttendanceData> = {
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
        "Verified attendance is temporarily unavailable.",
        503,
      );
    }

    return getErrorResponse(
      "PAYROLL_VERIFIED_ATTENDANCE_UNAVAILABLE",
      "Verified attendance is temporarily unavailable.",
      503,
    );
  }
}
