import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiRoleContext } from "@/server/auth/guards";
import {
  AdminUserAccountError,
  getAdminUserAccount,
  updateAdminUserAccount,
} from "@/server/admin/admin-user-account.service";
import type { ApiErrorResponse } from "@/types/api/responses";
import type { AdminUserAccountUpdateInput } from "@/types/admin-user-accounts";

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
  if (error instanceof AdminUserAccountError) {
    return errorResponse(error.code, error.message, error.status);
  }
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Firebase account data is temporarily unavailable.", 503);
  }
  return errorResponse("USER_ACCOUNT_UNAVAILABLE", "The user account could not be loaded.", 503);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    await requireApiRoleContext("admin");
    const { uid } = await params;
    return NextResponse.json({ success: true, data: await getAdminUserAccount(uid) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    const context = await requireApiRoleContext("admin");
    const { uid } = await params;
    const body = await request.json() as Record<string, unknown>;
    const input: AdminUserAccountUpdateInput = {};

    if (typeof body.username === "string") input.username = body.username;
    if (typeof body.displayName === "string") input.displayName = body.displayName;
    if (body.role !== undefined) input.role = body.role as AdminUserAccountUpdateInput["role"];
    if (body.employeeId === null || typeof body.employeeId === "string") input.employeeId = body.employeeId;
    if (typeof body.disabled === "boolean") input.disabled = body.disabled;

    return NextResponse.json({
      success: true,
      data: await updateAdminUserAccount(context.user, uid, input),
    });
  } catch (error) {
    return handleError(error);
  }
}
