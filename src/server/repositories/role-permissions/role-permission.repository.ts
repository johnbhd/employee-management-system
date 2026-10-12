import "server-only";

import type { DocumentData } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { isApplicationRole, type ApplicationRole } from "@/lib/auth/roles";
import { getFirebaseAdminDb } from "@/lib/firebase/server";
import { permissionKeys, type PermissionKey } from "@/types/permissions";
import type { RolePermissionAssignment } from "@/types/permissions";

const rolePermissionCollection = "rolePermissions";
const permissionKeySet = new Set<string>(permissionKeys);

export class RolePermissionDataError extends Error {
  readonly code = "ROLE_PERMISSION_DATA_INVALID";

  constructor(message = "The role-permission assignment has an invalid shape.") {
    super(message);
    this.name = "RolePermissionDataError";
  }
}

export class RolePermissionConflictError extends Error {
  readonly code = "ROLE_PERMISSION_CONFLICT";

  constructor(message = "The role-permission assignment changed before it was saved.") {
    super(message);
    this.name = "RolePermissionConflictError";
  }
}

function parseUpdatedBy(value: unknown) {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.uid !== "string" || typeof candidate.displayName !== "string") {
    return undefined;
  }
  return {
    uid: candidate.uid,
    displayName: candidate.displayName,
  };
}

function parseAssignment(
  id: string,
  data: DocumentData | undefined,
): RolePermissionAssignment | null {
  if (!data) return null;
  if (data.roleId !== id || !isApplicationRole(data.roleId)) {
    throw new RolePermissionDataError(`The ${id} role identifier is invalid.`);
  }
  if (!Array.isArray(data.permissions) || data.permissions.some((value) => (
    typeof value !== "string" || !permissionKeySet.has(value)
  ))) {
    throw new RolePermissionDataError(`The ${id} permission list contains an unknown key.`);
  }
  if (typeof data.version !== "number" || !Number.isInteger(data.version) || data.version < 1) {
    throw new RolePermissionDataError(`The ${id} permission version is invalid.`);
  }

  const updatedBy = parseUpdatedBy(data.updatedBy);
  if (updatedBy === undefined) {
    throw new RolePermissionDataError(`The ${id} update actor is invalid.`);
  }

  const updatedAt = data.updatedAt instanceof Timestamp
    ? data.updatedAt.toDate().toISOString()
    : null;

  if (new Set(data.permissions).size !== data.permissions.length) {
    throw new RolePermissionDataError(`The ${id} permission list contains duplicates.`);
  }

  return {
    roleId: data.roleId,
    permissions: data.permissions as PermissionKey[],
    version: data.version,
    updatedAt,
    updatedBy,
    source: "firestore",
  };
}

export async function getRolePermissionAssignment(
  role: ApplicationRole,
): Promise<RolePermissionAssignment | null> {
  const snapshot = await getFirebaseAdminDb()
    .collection(rolePermissionCollection)
    .doc(role)
    .get();

  return snapshot.exists ? parseAssignment(snapshot.id, snapshot.data()) : null;
}

export async function listRolePermissionAssignments(): Promise<RolePermissionAssignment[]> {
  const snapshots = await getFirebaseAdminDb()
    .collection(rolePermissionCollection)
    .get();

  return snapshots.docs.map((snapshot) => {
    const assignment = parseAssignment(snapshot.id, snapshot.data());
    if (!assignment) {
      throw new RolePermissionDataError(`The role-permission document ${snapshot.id} is invalid.`);
    }
    return assignment;
  });
}

export async function updateRolePermissionAssignment(input: {
  role: ApplicationRole;
  permissions: PermissionKey[];
  expectedVersion?: number;
  updatedBy: { uid: string; displayName: string };
}): Promise<RolePermissionAssignment> {
  const db = getFirebaseAdminDb();
  const reference = db.collection(rolePermissionCollection).doc(input.role);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    const current = snapshot.exists ? parseAssignment(snapshot.id, snapshot.data()) : null;
    const currentVersion = current?.version ?? 0;

    if (
      input.expectedVersion !== undefined
      && input.expectedVersion !== currentVersion
    ) {
      throw new RolePermissionConflictError();
    }

    transaction.set(reference, {
      roleId: input.role,
      permissions: [...new Set(input.permissions)],
      version: currentVersion + 1,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: input.updatedBy,
    });
  });

  const saved = await reference.get();
  const assignment = parseAssignment(saved.id, saved.data());

  if (!assignment) {
    throw new RolePermissionDataError("The updated role-permission assignment could not be read back.");
  }

  return assignment;
}
