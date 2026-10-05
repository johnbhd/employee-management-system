import { NextResponse } from "next/server";

import { getHrDashboardSummary } from "@/server/hr/hr-dashboard.service";
import {
    ApiAuthorizationError,
    requireApiRoleContext,
} from "@/server/auth/guards";
import {
    FirebaseAdminConfigurationError,
    FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { HrDashboardSummary } from "@/types/hr-dashboard";

export const runtime = "nodejs";

function getErrorResponse(
    code: string,
    message: string,
    status: number,
): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
        {
            success: false,
            error: {
                code,
                message,
            },
        },
        { status },
    );
}

export async function GET() {
    let context: Awaited<ReturnType<typeof requireApiRoleContext>>;

    try {
        context = await requireApiRoleContext("hr");
    } catch (error) {
        if (error instanceof ApiAuthorizationError) {
            return getErrorResponse(error.code, error.message, error.status);
        }

        return getErrorResponse(
            "HR_DASHBOARD_UNAVAILABLE",
            "The HR dashboard summary is temporarily unavailable.",
            503,
        );
    }

    if (!context.user) {
        return getErrorResponse(
            "HR_CONTEXT_UNAVAILABLE",
            "The authenticated HR context is unavailable.",
            403,
        );
    }

    try {
        const data = await getHrDashboardSummary();
        const response: ApiSuccessResponse<HrDashboardSummary> = {
            success: true,
            data,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        if (
            error instanceof FirebaseAdminConfigurationError
            || error instanceof FirebaseAdminInitializationError
        ) {
            return getErrorResponse(
                "FIREBASE_UNAVAILABLE",
                "The HR dashboard summary is temporarily unavailable.",
                503,
            );
        }

        return getErrorResponse(
            "HR_DASHBOARD_UNAVAILABLE",
            "The HR dashboard summary is temporarily unavailable.",
            503,
        );
    }
}
