import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { getAdminIntegrationMonitoringData } from "@/server/admin/integration-monitoring.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { AdminIntegrationMonitoringData } from "@/types/admin-integration-monitoring";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

export async function GET() {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.view", context.user);
    const data = await getAdminIntegrationMonitoringData();
    const response: ApiSuccessResponse<AdminIntegrationMonitoringData> = {
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
        "Integration monitoring data is temporarily unavailable.",
        503,
      );
    }

    return errorResponse(
      "INTEGRATION_MONITORING_UNAVAILABLE",
      "Integration monitoring data could not be loaded.",
      503,
    );
  }
}
