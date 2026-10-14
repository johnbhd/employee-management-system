import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import {
  ApiAuthorizationError,
  requireApiPermission,
  requireApiRoleContext,
} from "@/server/auth/guards";
import {
  AdminSettingsError,
  getAdminSettingsData,
  updateAdminSettings,
} from "@/server/admin/admin-settings.service";
import { SettingsRepositoryConflictError, SettingsRepositoryDataError } from "@/server/repositories/settings/settings.repository";
import type { AdminSettingsData, AdminSettingsUpdateRequest } from "@/types/admin-settings";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

function handleError(error: unknown) {
  if (error instanceof ApiAuthorizationError) {
    return errorResponse(error.code, error.message, error.status);
  }
  if (error instanceof AdminSettingsError) {
    return errorResponse(error.code, error.message, error.status);
  }
  if (error instanceof SettingsRepositoryConflictError) {
    return errorResponse("SETTINGS_CONFLICT", "These settings changed after you opened the page. Refresh and review the latest values before saving.", 409);
  }
  if (error instanceof SettingsRepositoryDataError) {
    return errorResponse(error.code, "The persisted system settings are invalid.", 503);
  }
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "System settings are temporarily unavailable.", 503);
  }
  return errorResponse("ADMIN_SETTINGS_UNAVAILABLE", "System settings could not be loaded.", 503);
}

export async function GET() {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.settings.view", context.user);
    const data = await getAdminSettingsData();
    const response: ApiSuccessResponse<AdminSettingsData> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.settings.manage", context.user);
    const body = await request.json() as Partial<AdminSettingsUpdateRequest>;
    const data = await updateAdminSettings({
      actor: context.user,
      request: {
        expectedVersion: body.expectedVersion ?? -1,
        settings: body.settings ?? {},
        resetKeys: body.resetKeys,
      },
    });
    const response: ApiSuccessResponse<AdminSettingsData> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}
