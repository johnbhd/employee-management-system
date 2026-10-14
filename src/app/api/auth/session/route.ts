import { NextResponse } from "next/server";

import {
    AUTH_SESSION_COOKIE_NAME,
    AUTH_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import { getRoleHomePath } from "@/lib/auth/roles";
import {
    FirebaseAdminConfigurationError,
    FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import type {
    ApiErrorResponse,
    ApiSuccessResponse,
} from "@/types/api/responses";
import type { AuthSessionData } from "@/types/auth";

import {
    AuthSessionError,
    createApplicationSession,
    getOptionalSessionUser,
} from "@/server/auth/session";

export const runtime = "nodejs";

type SessionSuccessResponse = ApiSuccessResponse<AuthSessionData>;

function getCookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
    };
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return getErrorResponse(
            "INVALID_REQUEST",
            "A valid authentication request is required.",
            400,
        );
    }

    if (
        !isRecord(body) ||
        typeof body.idToken !== "string" ||
        !body.idToken.trim() ||
        body.idToken.length > 10000
    ) {
        return getErrorResponse(
            "INVALID_REQUEST",
            "A valid authentication request is required.",
            400,
        );
    }

    try {
        const session = await createApplicationSession(body.idToken.trim());
        const response: SessionSuccessResponse = {
            success: true,
            data: {
                user: session.user,
                redirectTo: getRoleHomePath(session.user.role),
            },
        };
        const nextResponse = NextResponse.json(response, { status: 200 });

        nextResponse.cookies.set({
            ...getCookieOptions(),
            name: AUTH_SESSION_COOKIE_NAME,
            value: session.sessionCookie,
            maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
        });

        return nextResponse;
    } catch (error) {
        if (error instanceof AuthSessionError) {
            return getErrorResponse(error.code, error.message, error.status);
        }

        if (
            error instanceof FirebaseAdminConfigurationError ||
            error instanceof FirebaseAdminInitializationError
        ) {
            return getErrorResponse(
                "AUTHENTICATION_UNAVAILABLE",
                "Authentication is temporarily unavailable. Please try again.",
                503,
            );
        }

        return getErrorResponse(
            "AUTHENTICATION_UNAVAILABLE",
            "Authentication is temporarily unavailable. Please try again.",
            503,
        );
    }
}

export async function GET() {
    const user = await getOptionalSessionUser();

    if (!user) {
        return getErrorResponse(
            "UNAUTHENTICATED",
            "Authentication is required.",
            401,
        );
    }

    const response: SessionSuccessResponse = {
        success: true,
        data: {
            user,
            redirectTo: getRoleHomePath(user.role),
        },
    };

    return NextResponse.json(response, { status: 200 });
}

export async function DELETE() {
    const response = NextResponse.json(
        {
            success: true,
            data: {
                signedOut: true,
            },
        },
        { status: 200 },
    );

    response.cookies.set({
        ...getCookieOptions(),
        name: AUTH_SESSION_COOKIE_NAME,
        value: "",
        maxAge: 0,
        expires: new Date(0),
    });

    return response;
}
