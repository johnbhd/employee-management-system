import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import {
  AdminUserAccountError,
  createAdminUserAccount,
  getAdminUserAccountsData,
} from "@/server/admin/admin-user-account.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type {
  AdminUserAccountCreateInput,
  AdminUserAccountsData,
} from "@/types/admin-user-accounts";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
    { status },
  );
}

function queryNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.user_accounts.view", context.user);
    const url = new URL(request.url);
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    const link = url.searchParams.get("link");
    const data = await getAdminUserAccountsData({
      page: queryNumber(url.searchParams.get("page"), 1),
      pageSize: queryNumber(url.searchParams.get("pageSize"), 10),
      search: url.searchParams.get("search") ?? undefined,
      role: role === "admin" || role === "hr" || role === "employee" || role === "accounting" || role === "payroll" ? role : undefined,
      status: status === "active" || status === "disabled" || status === "missing" ? status : undefined,
      link: link === "linked" || link === "unlinked" || link === "invalid" ? link : undefined,
    });
    const response: ApiSuccessResponse<AdminUserAccountsData> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.user_accounts.manage", context.user);
    const body = await request.json() as Partial<AdminUserAccountCreateInput>;
    const data = await createAdminUserAccount(context.user, {
      email: body.email ?? "",
      password: body.password ?? "",
      username: body.username ?? "",
      displayName: body.displayName ?? "",
      role: body.role ?? "",
      employeeId: body.employeeId ?? null,
    } as AdminUserAccountCreateInput);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
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
  return errorResponse("USER_ACCOUNTS_UNAVAILABLE", "User account data could not be loaded.", 503);
}
