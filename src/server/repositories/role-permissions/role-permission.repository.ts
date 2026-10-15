import "server-only";

import { applicationRoles, type ApplicationRole } from "@/lib/auth/roles";
import { getPrismaClient } from "@/lib/prisma/server";
import { permissionKeys, type PermissionKey } from "@/types/permissions";
import type { RolePermissionAssignment } from "@/types/permissions";

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

type RolePermissionRow = {
  version: number;
  updatedAt: Date;
  updatedBySnapshot: unknown;
  permission: { key: string };
  updatedByUser: { firebaseUid: string; displayName: string } | null;
};

function updatedByForRows(rows: readonly RolePermissionRow[]) {
  const latest = [...rows].sort(
    (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
  )[0];

  if (!latest) return null;

  if (latest.updatedByUser) {
    return {
      uid: latest.updatedByUser.firebaseUid,
      displayName: latest.updatedByUser.displayName,
    };
  }

  if (
    latest.updatedBySnapshot
    && typeof latest.updatedBySnapshot === "object"
    && "uid" in latest.updatedBySnapshot
    && "displayName" in latest.updatedBySnapshot
    && typeof latest.updatedBySnapshot.uid === "string"
    && typeof latest.updatedBySnapshot.displayName === "string"
  ) {
    return {
      uid: latest.updatedBySnapshot.uid,
      displayName: latest.updatedBySnapshot.displayName,
    };
  }

  return null;
}

function toAssignment(
  role: ApplicationRole,
  rows: readonly RolePermissionRow[],
): RolePermissionAssignment {
  const permissions = rows.map((row) => row.permission.key);

  if (
    permissions.some((permission) => !permissionKeySet.has(permission))
    || new Set(permissions).size !== permissions.length
  ) {
    throw new RolePermissionDataError(`The ${role} permission list contains an unknown or duplicate key.`);
  }

  const latestUpdatedAt = rows
    .map((row) => row.updatedAt)
    .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;

  return {
    roleId: role,
    permissions: permissions as PermissionKey[],
    version: rows.length ? Math.max(...rows.map((row) => row.version)) : 0,
    updatedAt: latestUpdatedAt?.toISOString() ?? null,
    updatedBy: updatedByForRows(rows),
    source: "postgresql",
  };
}

async function getRoleId(role: ApplicationRole): Promise<string> {
  const record = await getPrismaClient().applicationRole.findUnique({
    where: { code: role },
    select: { id: true },
  });

  if (!record) {
    throw new RolePermissionDataError(`The ${role} application role is not configured.`);
  }

  return record.id;
}

export async function getRolePermissionAssignment(
  role: ApplicationRole,
): Promise<RolePermissionAssignment | null> {
  const roleId = await getRoleId(role);
  const rows = await getPrismaClient().rolePermission.findMany({
    where: { roleId },
    include: {
      permission: { select: { key: true } },
      updatedByUser: { select: { firebaseUid: true, displayName: true } },
    },
  });

  return rows.length ? toAssignment(role, rows) : null;
}

export async function listRolePermissionAssignments(): Promise<RolePermissionAssignment[]> {
  return Promise.all(
    applicationRoles.map((role) => getRolePermissionAssignment(role)),
  ).then((assignments) => (
    assignments.filter((assignment): assignment is RolePermissionAssignment => Boolean(assignment))
  ));
}

export async function updateRolePermissionAssignment(input: {
  role: ApplicationRole;
  permissions: PermissionKey[];
  expectedVersion?: number;
  updatedBy: { uid: string; displayName: string };
}): Promise<RolePermissionAssignment> {
  const prisma = getPrismaClient();
  const roleId = await getRoleId(input.role);
  const permissionRecords = await prisma.permission.findMany({
    where: { key: { in: input.permissions } },
    select: { id: true, key: true },
  });

  if (
    permissionRecords.length !== input.permissions.length
    || permissionRecords.some((permission) => !permissionKeySet.has(permission.key))
  ) {
    throw new RolePermissionDataError("The permission catalog does not contain every requested key.");
  }

  const actor = await prisma.user.findUnique({
    where: { firebaseUid: input.updatedBy.uid },
    select: { id: true },
  });

  if (!actor) {
    throw new RolePermissionDataError("The authorization actor is not mapped in PostgreSQL.");
  }

  let nextVersion = 1;
  const now = new Date();

  await prisma.$transaction(async (transaction) => {
    const currentRows = await transaction.rolePermission.findMany({
      where: { roleId },
      select: { version: true },
    });
    const currentVersion = currentRows.length
      ? Math.max(...currentRows.map((row) => row.version))
      : 0;

    if (
      input.expectedVersion !== undefined
      && input.expectedVersion !== currentVersion
    ) {
      throw new RolePermissionConflictError();
    }

    nextVersion = currentVersion + 1;
    await transaction.rolePermission.deleteMany({ where: { roleId } });

    if (permissionRecords.length) {
      await transaction.rolePermission.createMany({
        data: permissionRecords.map((permission) => ({
          roleId,
          permissionId: permission.id,
          version: nextVersion,
          updatedByUserId: actor.id,
          updatedBySnapshot: {
            uid: input.updatedBy.uid,
            displayName: input.updatedBy.displayName,
          },
          updatedAt: now,
        })),
      });
    }
  });

  return (await getRolePermissionAssignment(input.role)) ?? {
    roleId: input.role,
    permissions: [],
    version: nextVersion,
    updatedAt: now.toISOString(),
    updatedBy: input.updatedBy,
    source: "postgresql",
  };
}
