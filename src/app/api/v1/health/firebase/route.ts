import { NextResponse } from "next/server";

import {
    FirebaseAdminConfigurationError,
    FirebaseAdminInitializationError,
    getFirebaseAdminAuth,
    getFirebaseAdminDb,
} from "@/lib/firebase/server";
import type {
    ApiErrorResponse,
    ApiSuccessResponse,
} from "@/types/api/responses";

export const runtime = "nodejs";

type FirebaseHealthData = {
    status: "ok";
    services: {
        firebase: "connected";
        firestore: "reachable";
    };
};

function getFirebaseHealthError(error: unknown): ApiErrorResponse {
    if (error instanceof FirebaseAdminConfigurationError) {
        return {
            success: false,
            error: {
                code: error.code,
                message: "Firebase server configuration is incomplete.",
            },
        };
    }

    if (error instanceof FirebaseAdminInitializationError) {
        return {
            success: false,
            error: {
                code: error.code,
                message: "Firebase Admin could not be initialized.",
            },
        };
    }

    return {
        success: false,
        error: {
            code: "FIRESTORE_CONNECTIVITY_ERROR",
            message: "Firestore could not be reached.",
        },
    };
}

export async function GET() {
    try {
        getFirebaseAdminAuth();

        const database = getFirebaseAdminDb();

        await database.collection("_system").doc("health").get();

        const response: ApiSuccessResponse<FirebaseHealthData> = {
            success: true,
            data: {
                status: "ok",
                services: {
                    firebase: "connected",
                    firestore: "reachable",
                },
            },
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response = getFirebaseHealthError(error);

        return NextResponse.json(response, { status: 503 });
    }
}
