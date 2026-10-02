import { NextRequest, NextResponse } from "next/server";

import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export function proxy(request: NextRequest) {
    const sessionCookie = request.cookies.get(AUTH_SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/hr/:path*",
        "/employee/:path*",
        "/accounting/:path*",
    ],
};
