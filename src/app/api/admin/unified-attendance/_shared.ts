import { NextResponse } from "next/server";

import { ApiAuthorizationError } from "@/server/auth/guards";
import { UnifiedAttendanceProcessingServiceError } from "@/server/attendance/unified-attendance-processing.service";
import type { ApiErrorResponse } from "@/types/api/responses";

export function errorResponse(error: unknown, fallbackCode: string, fallbackMessage: string) {
  if (error instanceof ApiAuthorizationError || error instanceof UnifiedAttendanceProcessingServiceError) {
    return NextResponse.json<ApiErrorResponse>(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code: fallbackCode, message: fallbackMessage } },
    { status: 503 },
  );
}

export async function readJsonBody(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new UnifiedAttendanceProcessingServiceError("INVALID_REQUEST", "A JSON object is required.");
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof UnifiedAttendanceProcessingServiceError) throw error;
    throw new UnifiedAttendanceProcessingServiceError("INVALID_REQUEST", "A valid JSON request body is required.");
  }
}

export function requiredDate(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (typeof value !== "string") {
    throw new UnifiedAttendanceProcessingServiceError("INVALID_DATE_RANGE", `${key} must be a YYYY-MM-DD value.`);
  }
  return value;
}

export function pageParam(value: string | null, fallback: number) {
  const parsed = value ? Number(value) : fallback;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
