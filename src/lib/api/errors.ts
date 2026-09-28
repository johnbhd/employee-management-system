import type { ApiErrorResponse } from "@/types/api/responses";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

export function getApiErrorDetails(
  payload: unknown,
): ApiErrorResponse["error"] | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Partial<ApiErrorResponse>;

  if (
    candidate.success !== false ||
    !candidate.error ||
    typeof candidate.error !== "object"
  ) {
    return null;
  }

  const { code, message } = candidate.error;

  if (typeof code !== "string" || typeof message !== "string") {
    return null;
  }

  return {
    code,
    message,
  };
}
