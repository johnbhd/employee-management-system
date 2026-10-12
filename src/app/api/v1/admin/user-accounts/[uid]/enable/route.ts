import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import {
  AdminUserAccountError,
  setAdminUserAccountDisabled,
} from "@/server/admin/admin-user-account.service";
import type { ApiErrorResponse } from "@/types/api/responses";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

function handleError(error: unknown) {
  if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
  if (error instanceof AdminUserAccountError) return errorResponse(error.code, error.message, error.status);
  if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
    return errorResponse("FIREBASE_UNAVAILABLE", "Firebase account data is temporarily unavailable.", 503);
  }
  return errorResponse("USER_ACCOUNT_UNAVAILABLE", "The account status could not be updated.", 503);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.user_accounts.manage", context.user);
    const { uid } = await params;
    return NextResponse.json({ success: true, data: await setAdminUserAccountDisabled(context.user, uid, false) });
  } catch (error) {
    return handleError(error);
  }
}
