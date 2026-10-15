import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { buildBundyImportPreview, BundyImportError } from "@/server/bundy/bundy-import.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { BundyImportPreview } from "@/types/bundy-import";
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
    { success: false, error: { code: "BUNDY_PREVIEW_UNAVAILABLE", message: "The Bundy CSV preview could not be generated." } },
    { status: 503 },
  );
}

export async function POST(request: Request) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.view", context.user);
    const upload = await readBundyUpload(request);
    const response: ApiSuccessResponse<BundyImportPreview> = {
      success: true,
      data: await buildBundyImportPreview(upload.content, upload.filename),
    };
    return NextResponse.json(response);
  } catch (error) {
    return errorResponse(error);
  }
}
