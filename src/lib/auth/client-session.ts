"use client";

import {
    inMemoryPersistence,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";

import { setAuthFlashToast } from "@/lib/auth-flash-toast";
import {
    getFirebaseAuthEmail,
    getFirebaseAuthPassword,
} from "@/lib/auth/firebase-credential-adapter";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { apiRequest } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/errors";
import type { AuthSessionSuccessResponse } from "@/types/auth";

export type FirebaseAuthClientErrorCode =
    | "INVALID_CREDENTIALS"
    | "ACCOUNT_UNAVAILABLE"
    | "AUTHENTICATION_CONFIGURATION"
    | "AUTHENTICATION_UNAVAILABLE";

export class FirebaseAuthClientError extends Error {
    readonly code: FirebaseAuthClientErrorCode;

    constructor(code: FirebaseAuthClientErrorCode, message: string) {
        super(message);
        this.name = "FirebaseAuthClientError";
        this.code = code;
    }
}

function getFirebaseErrorCode(error: unknown): string | null {
    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
    ) {
        return error.code;
    }

    return null;
}

function getFirebaseAuthError(error: unknown): FirebaseAuthClientError {
    const code = getFirebaseErrorCode(error);

    if (code === "auth/user-disabled") {
        return new FirebaseAuthClientError(
            "ACCOUNT_UNAVAILABLE",
            "This account is currently unavailable. Please contact the system administrator.",
        );
    }

    if (
        code === "auth/operation-not-allowed" ||
        code === "auth/admin-restricted-operation"
    ) {
        return new FirebaseAuthClientError(
            "AUTHENTICATION_CONFIGURATION",
            "Username and password sign-in is not configured for this portal. Please contact the system administrator.",
        );
    }

    if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-email"
    ) {
        return new FirebaseAuthClientError(
            "INVALID_CREDENTIALS",
            "Invalid username or password.",
        );
    }

    return new FirebaseAuthClientError(
        "AUTHENTICATION_UNAVAILABLE",
        "Authentication is temporarily unavailable. Please try again.",
    );
}

export async function signInWithFirebaseSession(
    username: string,
    password: string,
) {
    const authEmail = getFirebaseAuthEmail(username);

    if (!authEmail) {
        throw new FirebaseAuthClientError(
            "INVALID_CREDENTIALS",
            "Invalid username or password.",
        );
    }

    const firebaseAuth = getFirebaseAuth();

    try {
        await setPersistence(firebaseAuth, inMemoryPersistence);

        const credential = await signInWithEmailAndPassword(
            firebaseAuth,
            authEmail,
            getFirebaseAuthPassword(password),
        );
        const idToken = await credential.user.getIdToken();

        const response = await apiRequest<AuthSessionSuccessResponse>(
            "/api/v1/auth/session",
            {
                method: "POST",
                body: JSON.stringify({
                    idToken,
                }),
            },
        );

        return response.data;
    } catch (error) {
        if (error instanceof FirebaseAuthClientError) {
            throw error;
        }

        if (error instanceof ApiClientError) {
            if (error.status === 401) {
                throw new FirebaseAuthClientError(
                    "INVALID_CREDENTIALS",
                    "Invalid username or password.",
                );
            }

            if (error.status === 403 || error.code === "ACCOUNT_UNAVAILABLE") {
                throw new FirebaseAuthClientError(
                    "ACCOUNT_UNAVAILABLE",
                    "This account is currently unavailable. Please contact the system administrator.",
                );
            }
        }

        throw getFirebaseAuthError(error);
    } finally {
        await signOut(firebaseAuth).catch(() => undefined);
    }
}

export async function logoutFromFirebaseSession(): Promise<void> {
    setAuthFlashToast({ type: "logout-success" });

    try {
        await fetch("/api/v1/auth/session", {
            method: "DELETE",
        });
    } catch {
        // Continue to clear the in-memory Firebase state and leave the portal.
    } finally {
        try {
            await signOut(getFirebaseAuth());
        } catch {
            // The server session is the source of truth for logout.
        }
    }
}
