import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { BundyImportError, synchronizeBundyImport } from "@/server/bundy/bundy-import.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { BundyImportResult } from "@/types/bundy-import";
import { readBundyUpload } from "../_shared";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  if (error instanceof ApiAuthorizationError || error instanceof BundyImportError) {
    return NextResponse.json<ApiErrorResponse>(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code: "BUNDY_IMPORT_UNAVAILABLE", message: "The Bundy import could not be completed safely." } },
    { status: 503 },
  );
}

export async function POST(request: Request) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.retry", context.user);
    const upload = await readBundyUpload(request, true);
    const response: ApiSuccessResponse<BundyImportResult> = {
      success: true,
      data: await synchronizeBundyImport({ ...upload, actor: context.user }),
    };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
