import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { HrpsImportError, HRPS_MAX_FILE_BYTES, buildHrpsImportPreview } from "@/server/hrps/hrps-import.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { HrpsImportPreview } from "@/types/hrps-import";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ success: false, error: { code, message } }, { status });
}

async function readUpload(request: Request) {
  const formData = await request.formData();
  const value = formData.get("file");
  if (!value || typeof value !== "object" || !("arrayBuffer" in value)) {
    throw new HrpsImportError("FILE_REQUIRED", "Choose a CSV file to preview.");
  }
  const file = value as File;
  if (!file.name.toLowerCase().endsWith(".csv")) {
    throw new HrpsImportError("INVALID_FILE_TYPE", "Only .csv files are supported.");
  }
  if (file.size > HRPS_MAX_FILE_BYTES) {
    throw new HrpsImportError("FILE_TOO_LARGE", "The CSV must be 5 MB or smaller.");
  }
  let content: string;
  try {
    content = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    throw new HrpsImportError("INVALID_ENCODING", "The CSV must be valid UTF-8 text.");
  }
  return { content, filename: file.name };
}

function handleError(error: unknown) {
  if (error instanceof ApiAuthorizationError) return errorResponse(error.code, error.message, error.status);
  if (error instanceof HrpsImportError) return errorResponse(error.code, error.message, error.status);
  return errorResponse("HRPS_PREVIEW_UNAVAILABLE", "The HRPS CSV preview could not be generated.", 503);
}

export async function POST(request: Request) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.view", context.user);
    const upload = await readUpload(request);
    const data: ApiSuccessResponse<HrpsImportPreview> = {
      success: true,
      data: await buildHrpsImportPreview(upload.content, upload.filename),
    };
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
