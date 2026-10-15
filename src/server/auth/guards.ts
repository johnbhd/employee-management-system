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
import { hasPermission } from "./permission.service";
import { AuthSessionError, getOptionalSessionUser } from "./session";
import type { PermissionKey } from "@/types/permissions";

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

    if (user.role === "employee" && user.mustChangePassword) {
        redirect("/employee/settings?setup=password");
    }

    if (user.role !== requiredRole) {
        redirect(getRoleHomePath(user.role));
    }

    return user;
}

export async function requireRoleContext(
    requiredRole: ApplicationRole,
    options: { allowMustChangePassword?: boolean } = {},
): Promise<CurrentUserContext> {
    const context = await requireCurrentUserContext();

    if (
        !options.allowMustChangePassword
        && context.user.role === "employee"
        && context.user.mustChangePassword
    ) {
        redirect("/employee/settings?setup=password");
    }

    if (context.user.role !== requiredRole) {
        redirect(getRoleHomePath(context.user.role));
    }

    return context;
}

export async function requireAnyRoleContext(
    ...requiredRoles: ApplicationRole[]
): Promise<CurrentUserContext> {
    const context = await requireCurrentUserContext();

    if (!requiredRoles.includes(context.user.role)) {
        redirect(getRoleHomePath(context.user.role));
    }

    return context;
}

export async function requireApiSessionUser(): Promise<SessionUser> {
    let user: SessionUser | null;

    try {
        user = await getOptionalSessionUser();
    } catch (error) {
        if (error instanceof AuthSessionError) {
            throw new ApiAuthorizationError(
                error.code === "INVALID_ID_TOKEN" ? "UNAUTHENTICATED" : "FORBIDDEN",
                error.status,
                error.message,
            );
        }

        throw error;
    }

    if (!user) {
        throw new ApiAuthorizationError(
            "UNAUTHENTICATED",
            401,
            "Authentication is required.",
        );
    }

    if (user.role === "employee" && user.mustChangePassword) {
        throw new ApiAuthorizationError(
            "FORBIDDEN",
            403,
            "Password change is required before using the employee portal.",
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

export async function requireApiRoles(
    ...requiredRoles: ApplicationRole[]
): Promise<SessionUser> {
    const user = await requireApiSessionUser();

    if (!requiredRoles.includes(user.role)) {
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

    if (context.user.role === "employee" && context.user.mustChangePassword) {
        throw new ApiAuthorizationError(
            "FORBIDDEN",
            403,
            "Password change is required before using the employee portal.",
        );
    }

    return context;
}

export async function requireApiPermission(
    permission: PermissionKey,
    user?: SessionUser,
): Promise<SessionUser> {
    const sessionUser = user ?? await requireApiSessionUser();

    if (!(await hasPermission(sessionUser, permission))) {
        throw new ApiAuthorizationError(
            "FORBIDDEN",
            403,
            "You do not have permission to perform this operation.",
        );
    }

    return sessionUser;
}
