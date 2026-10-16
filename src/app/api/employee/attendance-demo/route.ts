import { NextResponse } from "next/server";

import {
  DemoAttendanceDisabledError,
  DemoEmployeeUnavailableError,
  DemoAttendanceValidationError,
  getEmployeeAttendanceDemoData,
  updateEmployeeAttendanceDemoSettings,
} from "@/server/attendance/demo-attendance.service";
import {
  ApiAuthorizationError,
  requireApiRoleContext,
} from "@/server/auth/guards";
import type { ApiErrorResponse } from "@/types/api/responses";
import type { AttendanceDemoSettingsSuccessResponse } from "@/types/attendance-demo";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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

async function getEmployeeContext() {
  const context = await requireApiRoleContext("employee");

  if (!context.employee) {
    throw new DemoEmployeeUnavailableError();
  }

  return {
    ...context,
    employee: context.employee,
  };
}

function handleError(error: unknown) {
  if (error instanceof ApiAuthorizationError) {
    return errorResponse(error.code, error.message, error.status);
  }

  if (error instanceof DemoAttendanceDisabledError) {
    return errorResponse(error.code, error.message, 503);
  }

  if (error instanceof DemoAttendanceValidationError) {
    return errorResponse(error.code, error.message, 400);
  }

  if (error instanceof DemoEmployeeUnavailableError) {
    return errorResponse(error.code, error.message, 403);
  }

  return errorResponse(
    "DEMO_ATTENDANCE_UNAVAILABLE",
    "Employee attendance demonstration settings are temporarily unavailable.",
    503,
  );
}

export async function GET() {
  try {
    const context = await getEmployeeContext();
    const data = await getEmployeeAttendanceDemoData(context.employee.employeeId);
    const response: AttendanceDemoSettingsSuccessResponse = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "DEMO_ATTENDANCE_INVALID",
      "Demo attendance settings are invalid.",
      400,
    );
  }

  if (!isRecord(body) || typeof body.enabled !== "boolean") {
    return errorResponse(
      "DEMO_ATTENDANCE_INVALID",
      "The enabled setting must be a boolean.",
      400,
    );
  }

  const customTime = body.customTime === null || body.customTime === undefined
    ? null
    : typeof body.customTime === "string"
      ? body.customTime.trim()
      : null;

  try {
    const context = await getEmployeeContext();
    const data = await updateEmployeeAttendanceDemoSettings({
      employeeReference: context.employee.employeeId,
      enabled: body.enabled,
      customTime,
      actor: context.user,
    });
    const response: AttendanceDemoSettingsSuccessResponse = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}
