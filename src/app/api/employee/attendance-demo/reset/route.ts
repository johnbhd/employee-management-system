import { NextResponse } from "next/server";

import {
  DemoAttendanceDisabledError,
  DemoAttendanceResetBlockedError,
  DemoAttendanceResetProcessingError,
  DemoAttendanceValidationError,
  DemoEmployeeUnavailableError,
  resetEmployeeDemoAttendance,
} from "@/server/attendance/demo-attendance.service";
import {
  ApiAuthorizationError,
  requireApiRoleContext,
} from "@/server/auth/guards";
import type { ApiErrorResponse } from "@/types/api/responses";
import type { AttendanceDemoSettingsSuccessResponse } from "@/types/attendance-demo";

export const runtime = "nodejs";

function errorResponse(
  code: string,
  message: string,
  status: number,
) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

export async function POST() {
  try {
    const context = await requireApiRoleContext("employee");

    if (!context.employee) {
      throw new DemoEmployeeUnavailableError();
    }

    const data = await resetEmployeeDemoAttendance({
      employeeReference: context.employee.employeeId,
      actor: context.user,
    });
    const response: AttendanceDemoSettingsSuccessResponse = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return errorResponse(error.code, error.message, error.status);
    }

    if (error instanceof DemoAttendanceDisabledError) {
      return errorResponse(error.code, error.message, 503);
    }

    if (error instanceof DemoAttendanceResetBlockedError) {
      return errorResponse(error.code, error.reason, 409);
    }

    if (error instanceof DemoAttendanceResetProcessingError) {
      return errorResponse(error.code, error.message, 503);
    }

    if (error instanceof DemoAttendanceValidationError) {
      return errorResponse(error.code, error.message, 400);
    }

    if (error instanceof DemoEmployeeUnavailableError) {
      return errorResponse(error.code, error.message, 403);
    }

    return errorResponse(
      "DEMO_ATTENDANCE_RESET_UNAVAILABLE",
      "The simulated attendance could not be reset safely.",
      503,
    );
  }
}
