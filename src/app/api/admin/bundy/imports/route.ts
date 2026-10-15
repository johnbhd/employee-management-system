import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiPermission, requireApiRoleContext } from "@/server/auth/guards";
import { getBundyImportHistory, getBundyRawEventData } from "@/server/bundy/bundy-import.service";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { BundyPageData } from "@/types/bundy-import";

export const runtime = "nodejs";

function numberParam(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  try {
    const context = await requireApiRoleContext("admin");
    await requireApiPermission("admin.integration_monitoring.view", context.user);
    const url = new URL(request.url);
    const historyPage = numberParam(url.searchParams.get("page"), 1);
    const historyPageSize = numberParam(url.searchParams.get("pageSize"), 10);
    const eventPage = numberParam(url.searchParams.get("eventPage"), 1);
    const eventPageSize = numberParam(url.searchParams.get("eventPageSize"), 50);
    const data: ApiSuccessResponse<BundyPageData> = {
      success: true,
      data: {
        history: await getBundyImportHistory(historyPage, historyPageSize),
        events: await getBundyRawEventData(eventPage, eventPageSize),
      },
    };
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json<ApiErrorResponse>(
      { success: false, error: { code: "BUNDY_HISTORY_UNAVAILABLE", message: "Bundy import history is temporarily unavailable." } },
      { status: 503 },
    );
  }
}
