import { NextResponse } from "next/server";

import { ApiAuthorizationError, requireApiRole } from "@/server/auth/guards";
import {
  createHrAuditHistoryCsv,
  getHrAuditHistoryExportEvents,
} from "@/server/hr/audit-history.service";
import { parseAuditHistoryQuery } from "@/server/hr/audit-history-query";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireApiRole("hr");
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required.",
        },
      },
      { status: 401 },
    );
  }

  try {
    const url = new URL(request.url);

    if (url.searchParams.get("format") !== "csv") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUDIT_HISTORY_FORMAT_INVALID",
            message: "The audit history export format is invalid.",
          },
        },
        { status: 400 },
      );
    }

    const events = await getHrAuditHistoryExportEvents(
      parseAuditHistoryQuery(url.searchParams),
    );
    const csv = createHrAuditHistoryCsv(events);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=attendance-audit-history.csv",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "HR_AUDIT_HISTORY_UNAVAILABLE",
          message: "The audit history export is temporarily unavailable.",
        },
      },
      { status: 503 },
    );
  }
}
