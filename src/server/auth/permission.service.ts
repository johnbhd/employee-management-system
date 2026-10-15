import "server-only";

import { isApplicationRole, type ApplicationRole } from "@/lib/auth/roles";
import {
  defaultRolePermissions,
} from "@/lib/auth/permissions";
import type { SessionUser } from "@/types/auth";
import type { PermissionKey } from "@/types/permissions";

import { getRolePermissionAssignment } from "@/server/repositories/role-permissions/role-permission.repository";

export class PermissionDeniedError extends Error {
  readonly code = "FORBIDDEN";
  readonly status = 403 as const;

  constructor() {
    super("You do not have permission to perform this operation.");
    this.name = "PermissionDeniedError";
  }
}

export async function getPermissionsForRole(
  role: ApplicationRole,
): Promise<readonly PermissionKey[]> {
  const assignment = await getRolePermissionAssignment(role);
  return assignment?.permissions ?? defaultRolePermissions[role];
}

export async function getPermissionsForUser(
  user: Pick<SessionUser, "role">,
): Promise<readonly PermissionKey[]> {
  if (!isApplicationRole(user.role)) return [];

  try {
    return await getPermissionsForRole(user.role);
  } catch {
    return [];
  }
}

export async function hasPermission(
  user: Pick<SessionUser, "role">,
  permission: PermissionKey,
): Promise<boolean> {
  const permissions = await getPermissionsForUser(user);
  return permissions.includes(permission);
}

export async function requirePermission(
  user: Pick<SessionUser, "role">,
  permission: PermissionKey,
): Promise<void> {
  if (!(await hasPermission(user, permission))) {
    throw new PermissionDeniedError();
  }
}
