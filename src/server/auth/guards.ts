import "server-only";

import { redirect } from "next/navigation";

import {
    getRoleHomePath,
    type ApplicationRole,
} from "@/lib/auth/roles";
import type {
    CurrentUserContext,
    SessionUser,
} from "@/types/auth";

import {
    getCurrentUserContext,
    requireCurrentUserContext,
} from "./current-user-context";
import { getOptionalSessionUser } from "./session";

export class ApiAuthorizationError extends Error {
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN";
    readonly status: 401 | 403;

    constructor(
        code: "UNAUTHENTICATED" | "FORBIDDEN",
        status: 401 | 403,
        message: string,
    ) {
        super(message);
        this.name = "ApiAuthorizationError";
        this.code = code;
        this.status = status;
    }
}

export async function requireSessionUser(): Promise<SessionUser> {
    const user = await getOptionalSessionUser();

    if (!user) {
        redirect("/");
    }

    return user;
}

export async function requireRole(
    requiredRole: ApplicationRole,
): Promise<SessionUser> {
    const user = await requireSessionUser();

    if (user.role !== requiredRole) {
        redirect(getRoleHomePath(user.role));
    }

    return user;
}

export async function requireRoleContext(
    requiredRole: ApplicationRole,
): Promise<CurrentUserContext> {
    const context = await requireCurrentUserContext();

    if (context.user.role !== requiredRole) {
        redirect(getRoleHomePath(context.user.role));
    }

    return context;
}

export async function requireApiSessionUser(): Promise<SessionUser> {
    const user = await getOptionalSessionUser();

    if (!user) {
        throw new ApiAuthorizationError(
            "UNAUTHENTICATED",
            401,
            "Authentication is required.",
        );
    }

    return user;
}

export async function requireApiRole(
    requiredRole: ApplicationRole,
): Promise<SessionUser> {
    const user = await requireApiSessionUser();

    if (user.role !== requiredRole) {
        throw new ApiAuthorizationError(
            "FORBIDDEN",
            403,
            "You do not have permission to access this resource.",
        );
    }

    return user;
}

export async function requireApiRoleContext(
    requiredRole: ApplicationRole,
): Promise<CurrentUserContext> {
    const context = await getCurrentUserContext();

    if (!context) {
        throw new ApiAuthorizationError(
            "UNAUTHENTICATED",
            401,
            "Authentication is required.",
        );
    }

    if (context.user.role !== requiredRole) {
        throw new ApiAuthorizationError(
            "FORBIDDEN",
            403,
            "You do not have permission to access this resource.",
        );
    }

    return context;
}
