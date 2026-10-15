import "server-only";

import { getFirebaseAdminAuth } from "@/lib/firebase/server";
import { getFirebaseAuthEmail } from "@/lib/auth/firebase-credential-adapter";
import { getPrismaClient } from "@/lib/prisma/server";
import {
  getHrpsEmployeeUsername,
  getHrpsTemporaryPassword,
} from "./hrps-account-policy";

const employeeRole = "employee" as const;

export class HrpsAccountProvisioningError extends Error {
  readonly code: string;
  readonly status: 400 | 409 | 503;
  readonly firebaseUid: string | null;
  readonly firebaseCreated: boolean;

  constructor(
    code: string,
    message: string,
    status: 400 | 409 | 503 = 503,
    options: { firebaseUid?: string | null; firebaseCreated?: boolean } = {},
  ) {
    super(message);
    this.name = "HrpsAccountProvisioningError";
    this.code = code;
    this.status = status;
    this.firebaseUid = options.firebaseUid ?? null;
    this.firebaseCreated = options.firebaseCreated ?? false;
  }
}

export type HrpsAccountProvisioningResult = {
  action: "created" | "reused";
  applicationUserId: string;
  firebaseUid: string;
  username: string;
  firebaseCreated: boolean;
  applicationUserCreated: boolean;
};

type EmployeeAccountTarget = {
  id: string;
  employeeId: string;
  department: string;
  displayName: string;
};

function firebaseErrorCode(error: unknown): string | null {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code
    : null;
}

function isFirebaseUserNotFound(error: unknown): boolean {
  return firebaseErrorCode(error) === "auth/user-not-found";
}

function isFirebaseEmailConflict(error: unknown): boolean {
  return firebaseErrorCode(error) === "auth/email-already-exists";
}

function safeProvisioningMessage(error: unknown): string {
  const code = firebaseErrorCode(error);
  return code ? `Firebase account provisioning failed (${code}).` : "The Employee account could not be provisioned safely.";
}

async function findEmployeeUser(employeeId: string) {
  return getPrismaClient().user.findMany({
    where: { employee: { employeeId } },
    select: {
      id: true,
      firebaseUid: true,
      username: true,
      displayName: true,
      status: true,
      role: { select: { code: true } },
      employee: { select: { employeeId: true } },
    },
  });
}

async function getExistingUserByUsername(username: string) {
  return getPrismaClient().user.findUnique({
    where: { username },
    select: {
      id: true,
      firebaseUid: true,
      username: true,
      employee: { select: { employeeId: true } },
      role: { select: { code: true } },
    },
  });
}

async function getFirebaseUserByEmail(email: string) {
  try {
    return await getFirebaseAdminAuth().getUserByEmail(email);
  } catch (error) {
    if (isFirebaseUserNotFound(error)) return null;
    throw error;
  }
}

function conflict(message: string): HrpsAccountProvisioningError {
  return new HrpsAccountProvisioningError("ACCOUNT_PROVISIONING_CONFLICT", message, 409);
}

export async function provisionHrpsEmployeeAccount(
  target: EmployeeAccountTarget,
): Promise<HrpsAccountProvisioningResult> {
  const linkedUsers = await findEmployeeUser(target.employeeId);

  if (linkedUsers.length > 1) {
    throw conflict("The Employee has more than one application account and requires Admin review.");
  }

  const linkedUser = linkedUsers[0];
  if (linkedUser) {
    if (linkedUser.role.code !== employeeRole || linkedUser.username === "aujsc.admin") {
      throw conflict("The Employee is linked to a protected or non-Employee application account.");
    }

    return {
      action: "reused",
      applicationUserId: linkedUser.id,
      firebaseUid: linkedUser.firebaseUid,
      username: linkedUser.username,
      firebaseCreated: false,
      applicationUserCreated: false,
    };
  }

  const username = getHrpsEmployeeUsername(target.department, target.employeeId);
  const existingUsername = await getExistingUserByUsername(username);
  if (existingUsername) {
    throw conflict("The generated Employee username is already assigned to another application account.");
  }

  const email = getFirebaseAuthEmail(username);
  if (!email) {
    throw new HrpsAccountProvisioningError(
      "AUTH_IDENTITY_MAPPING_UNAVAILABLE",
      "The generated Employee username has no supported Firebase identity mapping.",
      503,
    );
  }

  const existingFirebaseUser = await getFirebaseUserByEmail(email);
  if (existingFirebaseUser) {
    const existingProfile = await getPrismaClient().user.findUnique({
      where: { firebaseUid: existingFirebaseUser.uid },
      select: { id: true, employee: { select: { employeeId: true } } },
    });
    if (existingProfile?.employee?.employeeId === target.employeeId) {
      return {
        action: "reused",
        applicationUserId: existingProfile.id,
        firebaseUid: existingFirebaseUser.uid,
        username,
        firebaseCreated: false,
        applicationUserCreated: false,
      };
    }
    throw conflict("A Firebase identity already uses the generated Employee username and cannot be linked safely.");
  }

  let firebaseRecord;
  try {
    firebaseRecord = await getFirebaseAdminAuth().createUser({
      email,
      password: getHrpsTemporaryPassword(target.employeeId),
      displayName: target.displayName,
      disabled: false,
    });
  } catch (error) {
    if (isFirebaseEmailConflict(error)) {
      throw conflict("A Firebase identity was created concurrently for the generated Employee username.");
    }
    throw new HrpsAccountProvisioningError("FIREBASE_ACCOUNT_CREATE_FAILED", safeProvisioningMessage(error));
  }

  try {
    const created = await getPrismaClient().user.create({
      data: {
        firebaseUid: firebaseRecord.uid,
        username,
        displayName: target.displayName,
        status: "active",
        mustChangePassword: false,
        role: { connect: { code: employeeRole } },
        employee: { connect: { id: target.id } },
      },
      select: { id: true },
    });

    return {
      action: "created",
      applicationUserId: created.id,
      firebaseUid: firebaseRecord.uid,
      username,
      firebaseCreated: true,
      applicationUserCreated: true,
    };
  } catch {
    let cleanupSucceeded = true;
    try {
      await getFirebaseAdminAuth().deleteUser(firebaseRecord.uid);
    } catch {
      cleanupSucceeded = false;
    }

    throw new HrpsAccountProvisioningError(
      cleanupSucceeded ? "APPLICATION_USER_CREATE_FAILED" : "ACCOUNT_PROVISIONING_INCOMPLETE",
      cleanupSucceeded
        ? "The Employee account could not be saved in PostgreSQL; the Firebase identity was removed safely."
        : "The Employee account could not be saved in PostgreSQL and its Firebase identity requires Admin cleanup before retrying.",
      cleanupSucceeded ? 503 : 503,
      {
        firebaseUid: firebaseRecord.uid,
        firebaseCreated: !cleanupSucceeded,
      },
    );
  }
}
