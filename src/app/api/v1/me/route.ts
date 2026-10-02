import { NextResponse } from "next/server";

import {
    FirebaseAdminConfigurationError,
    FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import { getCurrentUserContext } from "@/server/auth/current-user-context";
import type { ApiErrorResponse } from "@/types/api/responses";
import type { CurrentUserSuccessResponse } from "@/types/auth";

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
    try {
        const context = await getCurrentUserContext();

        if (!context) {
            return getErrorResponse(
                "UNAUTHENTICATED",
                "Authentication is required.",
                401,
            );
        }

        if (
            (context.user.role === "employee" || context.user.employeeId)
            && !context.employee
        ) {
            return getErrorResponse(
                "EMPLOYEE_REFERENCE_UNAVAILABLE",
                "Employee information is currently unavailable for this account.",
                403,
            );
        }

        const response: CurrentUserSuccessResponse = {
            success: true,
            data: context,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        if (
            error instanceof FirebaseAdminConfigurationError
            || error instanceof FirebaseAdminInitializationError
        ) {
            return getErrorResponse(
                "AUTHENTICATION_UNAVAILABLE",
                "Authentication is temporarily unavailable. Please try again.",
                503,
            );
        }

        return getErrorResponse(
            "CURRENT_USER_UNAVAILABLE",
            "The current user information could not be loaded.",
            503,
        );
    }
}
