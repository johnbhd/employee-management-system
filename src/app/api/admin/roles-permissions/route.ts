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
import { getRolesPermissionsData } from "@/server/admin/roles-permissions.service";
import {
  RolePermissionDataError,
} from "@/server/repositories/role-permissions/role-permission.repository";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { RolesPermissionsData } from "@/types/permissions";

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
  if (error instanceof RolePermissionDataError) {
    return errorResponse(error.code, "Role-permission configuration is invalid.", 503);
  }
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Roles and permissions are temporarily unavailable.", 503);
  }
  return errorResponse("ROLES_PERMISSIONS_UNAVAILABLE", "Roles and permissions could not be loaded.", 503);
}

export async function GET() {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.roles_permissions.view", context.user);
    const data = await getRolesPermissionsData();
    const response: ApiSuccessResponse<RolesPermissionsData> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}
