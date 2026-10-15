import { NextResponse } from "next/server";

import {
  FirebaseAdminConfigurationError,
  FirebaseAdminInitializationError,
  getFirebaseAdminAuth,
} from "@/lib/firebase/server";
import { getAuthenticatedHomePath } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/prisma/server";
import { ApiAuthorizationError } from "@/server/auth/guards";
import { getOptionalSessionUser } from "@/server/auth/session";
import { findUserIdByFirebaseUid, toActorSnapshot, toJson } from "@/server/repositories/prisma/prisma-repository-helpers";
import { getApplicationUserByUid } from "@/server/repositories/users/user.repository";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api/responses";
import type { AuthSessionData } from "@/types/auth";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, error: { code, message } },
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
    return errorResponse("INVALID_REQUEST", "A valid password setup request is required.", 400);
  }

  if (!isRecord(body) || typeof body.idToken !== "string" || !body.idToken.trim() || body.idToken.length > 10000) {
    return errorResponse("INVALID_REQUEST", "A valid password setup request is required.", 400);
  }

  try {
    const sessionUser = await getOptionalSessionUser();
    if (!sessionUser) {
      throw new ApiAuthorizationError("UNAUTHENTICATED", 401, "Authentication is required.");
    }
    if (sessionUser.role !== "employee") {
      throw new ApiAuthorizationError("FORBIDDEN", 403, "Only Employee accounts can change their password here.");
    }

    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(body.idToken.trim());
    if (decodedToken.uid !== sessionUser.uid) {
      throw new ApiAuthorizationError("FORBIDDEN", 403, "The password setup identity does not match the signed-in account.");
    }

    const actorUserId = await findUserIdByFirebaseUid(sessionUser.uid);
    try {
      await getPrismaClient().$transaction(async (transaction) => {
        if (sessionUser.mustChangePassword) {
          await transaction.user.update({
            where: { firebaseUid: sessionUser.uid },
            data: { mustChangePassword: false },
          });
        }

        await transaction.auditEvent.create({
          data: {
            eventType: sessionUser.mustChangePassword
              ? "auth.employee.first_password_changed"
              : "auth.employee.password_changed",
            action: sessionUser.mustChangePassword
              ? "Employee First Password Changed"
              : "Employee Password Changed",
            module: "Authentication",
            actorType: "user",
            actorUserId,
            actorUid: sessionUser.uid,
            actorSnapshot: toJson(toActorSnapshot(sessionUser)),
            targetType: "user",
            targetId: sessionUser.uid,
            targetReference: sessionUser.username,
            targetLabel: sessionUser.displayName,
            outcome: "Successful",
            summary: sessionUser.mustChangePassword
              ? "An Employee completed the required first-login password change."
              : "An Employee changed their password from Employee Settings.",
            metadata: toJson({ firebaseUid: sessionUser.uid }),
            occurredAt: new Date(),
          },
        });
      });
    } catch {
      if (sessionUser.mustChangePassword) {
        return errorResponse(
          "PASSWORD_CHANGE_SYNC_REQUIRED",
          "Your Firebase password was changed, but Employee setup could not finish. Sign in again with the new password to complete setup.",
          503,
        );
      }

      return errorResponse(
        "PASSWORD_CHANGE_UNAVAILABLE",
        "Your password could not be recorded completely. Please try again from Employee Settings.",
        503,
      );
    }

    const user = await getApplicationUserByUid(sessionUser.uid);
    if (!user) {
      return errorResponse("ACCOUNT_UNAVAILABLE", "The application account could not be refreshed.", 503);
    }

    const response: ApiSuccessResponse<AuthSessionData> = {
      success: true,
      data: {
        user,
        redirectTo: getAuthenticatedHomePath(user),
      },
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof ApiAuthorizationError) {
      return errorResponse(error.code, error.message, error.status);
    }
    if (error instanceof FirebaseAdminConfigurationError || error instanceof FirebaseAdminInitializationError) {
      return errorResponse("AUTHENTICATION_UNAVAILABLE", "Authentication is temporarily unavailable. Please try again.", 503);
    }
    return errorResponse("PASSWORD_CHANGE_UNAVAILABLE", "The password could not be changed completely. Please try again.", 503);
  }
}
