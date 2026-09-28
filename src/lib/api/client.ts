import { ApiClientError, getApiErrorDetails } from "./errors";

async function parseResponse(response: Response): Promise<unknown> {
  const body = await response.text();

  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

export async function apiRequest<T>(
  input: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });
  const payload = await parseResponse(response);

  if (!response.ok) {
    const errorDetails = getApiErrorDetails(payload);
    const message =
      errorDetails?.message || response.statusText || "The API request failed.";

    throw new ApiClientError(
      message,
      response.status,
      errorDetails?.code || "API_REQUEST_FAILED",
    );
  }

  return payload as T;
}
