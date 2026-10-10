import { NextResponse } from "next/server";

import {
    FirebaseAdminConfigurationError,
    FirebaseAdminInitializationError,
} from "@/lib/firebase/server";
import {
    ApiAuthorizationError,
    requireApiRoleContext,
} from "@/server/auth/guards";
import { reviewAttendanceCorrection } from "@/server/hr/attendance-corrections.service";
import {
    AttendanceCorrectionError,
} from "@/server/repositories/attendance-corrections/attendance-correction.repository";
import type { ApiErrorResponse } from "@/types/api/responses";
import type { AttendanceCorrectionDecision } from "@/types/attendance-correction";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        requestId: string;
    }>;
};

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

function parsePayload(
    payload: unknown,
): {
    decision: AttendanceCorrectionDecision;
    reviewNote: string | null;
} {
    if (!payload || typeof payload !== "object") {
        throw new AttendanceCorrectionError(
            "ATTENDANCE_CORRECTION_VALIDATION_ERROR",
            400,
            "A decision is required.",
        );
    }

    const candidate = payload as {
        decision?: unknown;
        reviewNote?: unknown;
    };

    if (candidate.decision !== "approve" && candidate.decision !== "reject") {
        throw new AttendanceCorrectionError(
            "ATTENDANCE_CORRECTION_VALIDATION_ERROR",
            400,
            "The correction decision is invalid.",
        );
    }

    if (
        candidate.reviewNote !== undefined
        && candidate.reviewNote !== null
        && typeof candidate.reviewNote !== "string"
    ) {
        throw new AttendanceCorrectionError(
            "ATTENDANCE_CORRECTION_VALIDATION_ERROR",
            400,
            "The review note is invalid.",
        );
    }

    const reviewNote = typeof candidate.reviewNote === "string"
        ? candidate.reviewNote.trim()
        : "";

    if (reviewNote.length > 1000) {
        throw new AttendanceCorrectionError(
            "ATTENDANCE_CORRECTION_VALIDATION_ERROR",
            400,
            "The review note is too long.",
        );
    }

    if (candidate.decision === "reject" && !reviewNote) {
        throw new AttendanceCorrectionError(
            "ATTENDANCE_CORRECTION_VALIDATION_ERROR",
            400,
            "A rejection reason is required.",
        );
    }

    return {
        decision: candidate.decision,
        reviewNote: reviewNote || null,
    };
}

export async function POST(
    request: Request,
    routeContext: RouteContext,
) {
    let context: Awaited<ReturnType<typeof requireApiRoleContext>>;
    let requestId: string;

    try {
        context = await requireApiRoleContext("hr");
        ({ requestId } = await routeContext.params);
    } catch (error) {
        if (error instanceof ApiAuthorizationError) {
            return getErrorResponse(error.code, error.message, error.status);
        }

        return getErrorResponse(
            "UNAUTHORIZED",
            "Authentication is required.",
            401,
        );
    }

    if (!/^[A-Za-z0-9_-]{1,128}$/.test(requestId)) {
        return getErrorResponse(
            "ATTENDANCE_CORRECTION_REQUEST_ID_INVALID",
            "The correction request identifier is invalid.",
            400,
        );
    }

    let payload: {
        decision: AttendanceCorrectionDecision;
        reviewNote: string | null;
    };

    try {
        payload = parsePayload(await request.json());
    } catch (error) {
        if (error instanceof AttendanceCorrectionError) {
            return getErrorResponse(error.code, error.message, error.status);
        }

        return getErrorResponse(
            "ATTENDANCE_CORRECTION_VALIDATION_ERROR",
            "The correction decision payload is invalid.",
            400,
        );
    }

    try {
        await reviewAttendanceCorrection({
            requestId,
            decision: payload.decision,
            reviewNote: payload.reviewNote,
            reviewer: context.user,
        });

        return NextResponse.json({
            success: true,
            data: {
                requestId,
                decision: payload.decision,
            },
        });
    } catch (error) {
        if (error instanceof AttendanceCorrectionError) {
            const message = error.status >= 500
                ? "The correction decision could not be completed."
                : error.message;

            return getErrorResponse(error.code, message, error.status);
        }

        if (
            error instanceof FirebaseAdminConfigurationError
            || error instanceof FirebaseAdminInitializationError
        ) {
            return getErrorResponse(
                "FIREBASE_UNAVAILABLE",
                "The correction decision service is temporarily unavailable.",
                503,
            );
        }

        return getErrorResponse(
            "ATTENDANCE_CORRECTION_UNAVAILABLE",
            "The correction decision could not be completed.",
            500,
        );
    }
}
