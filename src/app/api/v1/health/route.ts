import { NextResponse } from "next/server";

import type { ApiSuccessResponse } from "@/types/api/responses";

export async function GET() {
  const response: ApiSuccessResponse<{ status: "ok" }> = {
    success: true,
    data: {
      status: "ok",
    },
  };

  return NextResponse.json(response, { status: 200 });
}
