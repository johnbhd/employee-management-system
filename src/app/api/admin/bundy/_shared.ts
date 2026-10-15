import { BundyImportError, BUNDY_MAX_FILE_BYTES } from "@/server/bundy/bundy-import.service";

export async function readBundyUpload(request: Request, requirePreviewToken = false) {
  const formData = await request.formData();
  const value = formData.get("file");
  const previewToken = formData.get("previewToken");
  if (!value || typeof value !== "object" || !("arrayBuffer" in value)) {
    throw new BundyImportError("FILE_REQUIRED", "Choose a Bundy CSV file.");
  }
  if (requirePreviewToken && (typeof previewToken !== "string" || !previewToken)) {
    throw new BundyImportError("PREVIEW_REQUIRED", "Preview the Bundy CSV before confirming import.");
  }
  const file = value as File;
  if (!file.name.toLowerCase().endsWith(".csv")) {
    throw new BundyImportError("INVALID_FILE_TYPE", "Only .csv files are supported.");
  }
  if (file.size > BUNDY_MAX_FILE_BYTES) {
    throw new BundyImportError("FILE_TOO_LARGE", "The Bundy CSV must be 5 MB or smaller.");
  }
  let content: string;
  try {
    content = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    throw new BundyImportError("INVALID_ENCODING", "The Bundy CSV must be valid UTF-8 text.");
  }
  return {
    content,
    filename: file.name,
    previewToken: typeof previewToken === "string" ? previewToken : "",
  };
}

export function bundyErrorResponse(error: unknown, fallbackCode: string, fallbackMessage: string) {
  if (error instanceof BundyImportError) {
    return Response.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  return Response.json(
    { success: false, error: { code: fallbackCode, message: fallbackMessage } },
    { status: 503 },
  );
}
