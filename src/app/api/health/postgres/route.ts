import { NextResponse } from "next/server";

import { checkPostgresHealth } from "@/lib/postgres/server";
import type { ApiSuccessResponse } from "@/types/api/responses";

export const runtime = "nodejs";

type PostgresHealthData = {
  status: "ok" | "unavailable";
  database: "postgresql";
  configured: boolean;
  connected: boolean;
};

export async function GET() {
  const health = await checkPostgresHealth();
  const response: ApiSuccessResponse<PostgresHealthData> = {
    success: true,
    data: {
      status: health.connected ? "ok" : "unavailable",
      database: "postgresql",
      configured: health.configured,
      connected: health.connected,
    },
  };

  return NextResponse.json(response, {
    status: health.connected ? 200 : 503,
  });
}
