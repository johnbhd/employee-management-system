import { NextResponse } from "next/server";

import {
    FirebaseAdminConfigurationError,
    FirebaseAdminInitializationError,
    getFirebaseAdminAuth,
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
            code: "FIREBASE_CONNECTIVITY_ERROR",
            message: "Firebase Authentication could not be reached.",
        },
    };
}

export async function GET() {
    try {
        await getFirebaseAdminAuth().listUsers(1);

        const response: ApiSuccessResponse<FirebaseHealthData> = {
            success: true,
            data: {
                status: "ok",
                services: {
                    firebase: "connected",
                },
            },
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response = getFirebaseHealthError(error);

        return NextResponse.json(response, { status: 503 });
    }
}
