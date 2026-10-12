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
import { updateRolePermissions } from "@/server/admin/roles-permissions.service";
import {
  RolePermissionConflictError,
  RolePermissionDataError,
} from "@/server/repositories/role-permissions/role-permission.repository";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { RolePermissionView } from "@/types/permissions";

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
  if (error instanceof RolePermissionConflictError) {
    return errorResponse(error.code, error.message, 409);
  }
  if (error instanceof RolePermissionDataError) {
    return errorResponse(error.code, "Role-permission configuration is invalid.", 503);
  }
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Roles and permissions are temporarily unavailable.", 503);
  }
  if (error instanceof Error && "code" in error && "status" in error) {
    const candidate = error as Error & { code: unknown; status: unknown };
    if (typeof candidate.code === "string" && (candidate.status === 400 || candidate.status === 409)) {
      return errorResponse(candidate.code, error.message, candidate.status);
    }
  }
  return errorResponse("ROLES_PERMISSIONS_UPDATE_UNAVAILABLE", "The role permissions could not be saved.", 503);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> },
) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.roles_permissions.manage", context.user);
    const { roleId } = await params;
    const body = await request.json() as Record<string, unknown>;
    const expectedVersion = body.expectedVersion;

    if (typeof expectedVersion !== "number" || !Number.isInteger(expectedVersion) || expectedVersion < 0) {
      return errorResponse("INVALID_VERSION", "The permission version is invalid.", 400);
    }

    const role = await updateRolePermissions({
      actor: context.user,
      roleId,
      permissions: body.permissions,
      expectedVersion,
    });
    const response: ApiSuccessResponse<RolePermissionView> = { success: true, data: role };
    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}
