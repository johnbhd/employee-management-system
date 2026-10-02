import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { cookies } from "next/headers";

import {
    AUTH_RECENT_LOGIN_MAX_AGE_SECONDS,
    AUTH_SESSION_COOKIE_NAME,
    AUTH_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import {
    getFirebaseAdminAuth,
} from "@/lib/firebase/server";
import type {
    ApplicationUser,
    SessionUser,
} from "@/types/auth";

import { getApplicationUserByUid } from "../repositories/users/user.repository";

export class AuthSessionError extends Error {
    readonly code: "INVALID_ID_TOKEN" | "ACCOUNT_UNAVAILABLE";
    readonly status: 401 | 403;

    constructor(
        code: "INVALID_ID_TOKEN" | "ACCOUNT_UNAVAILABLE",
        status: 401 | 403,
        message: string,
    ) {
        super(message);
        this.name = "AuthSessionError";
        this.code = code;
        this.status = status;
    }
}

export type CreatedApplicationSession = {
    sessionCookie: string;
    user: SessionUser;
};

function toSessionUser(user: ApplicationUser): SessionUser {
    return {
        uid: user.uid,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        employeeId: user.employeeId,
    };
}

function isRecentAuthentication(decodedToken: DecodedIdToken): boolean {
    if (typeof decodedToken.auth_time !== "number") {
        return false;
    }

    const ageInSeconds = Math.floor(Date.now() / 1000) - decodedToken.auth_time;

    return (
        ageInSeconds >= 0 &&
        ageInSeconds <= AUTH_RECENT_LOGIN_MAX_AGE_SECONDS
    );
}

async function getActiveUserByUid(uid: string): Promise<SessionUser> {
    const user = await getApplicationUserByUid(uid);

    if (!user || user.status !== "active") {
        throw new AuthSessionError(
            "ACCOUNT_UNAVAILABLE",
            403,
            "This account is currently unavailable. Please contact the system administrator.",
        );
    }

    return toSessionUser(user);
}

export async function createApplicationSession(
    idToken: string,
): Promise<CreatedApplicationSession> {
    const adminAuth = getFirebaseAdminAuth();
    let decodedToken: DecodedIdToken;

    try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
        throw new AuthSessionError(
            "INVALID_ID_TOKEN",
            401,
            "Invalid username or password.",
        );
    }

    if (!isRecentAuthentication(decodedToken)) {
        throw new AuthSessionError(
            "INVALID_ID_TOKEN",
            401,
            "Invalid username or password.",
        );
    }

    const user = await getActiveUserByUid(decodedToken.uid);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn: AUTH_SESSION_MAX_AGE_SECONDS * 1000,
    });

    return {
        sessionCookie,
        user,
    };
}

export async function getOptionalSessionUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        const decodedToken = await getFirebaseAdminAuth().verifySessionCookie(
            sessionCookie,
            true,
        );
        return await getActiveUserByUid(decodedToken.uid);
    } catch {
        return null;
    }
}
