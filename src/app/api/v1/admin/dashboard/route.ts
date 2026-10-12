import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { getAdminDashboardData } from "@/server/admin/admin-dashboard.service";
import {
  ApiAuthorizationError,
  requireApiPermission,
  requireApiRoleContext,
} from "@/server/auth/guards";
import type { AdminDashboardData } from "@/types/admin-dashboard";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";

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
    await requireApiPermission("admin.dashboard.view", context.user);

    const data = await getAdminDashboardData();
    const response: ApiSuccessResponse<AdminDashboardData> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return errorResponse(error.code, error.message, error.status);
    }

    if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
      return errorResponse(
        "FIREBASE_UNAVAILABLE",
        "Admin dashboard data is temporarily unavailable.",
        503,
      );
    }

    return errorResponse(
      "ADMIN_DASHBOARD_UNAVAILABLE",
      "Admin dashboard data could not be loaded.",
      503,
    );
  }
}
