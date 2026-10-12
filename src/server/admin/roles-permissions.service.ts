import "server-only";

import {
  applicationRoleDefinitions,
  defaultRolePermissions,
  getPermissionDefinition,
  permissionCatalog,
  reservedPermissionsForAdmin,
} from "@/lib/auth/permissions";
import { isApplicationRole, type ApplicationRole } from "@/lib/auth/roles";
import type { SessionUser } from "@/types/auth";
import type {
  PermissionKey,
  RolePermissionAssignment,
  RolePermissionView,
  RolesPermissionsData,
} from "@/types/permissions";

import { writeAdminAuditEvent } from "@/server/repositories/admin-audit/admin-audit.repository";
import {
  getRolePermissionAssignment,
  RolePermissionConflictError,
  updateRolePermissionAssignment,
} from "@/server/repositories/role-permissions/role-permission.repository";
import { listApplicationUsers } from "@/server/repositories/users/user.repository";

export class RolesPermissionsError extends Error {
  readonly code: string;
  readonly status: 400 | 409;

  constructor(code: string, message: string, status: 400 | 409 = 400) {
    super(message);
    this.name = "RolesPermissionsError";
    this.code = code;
    this.status = status;
  }
}

function defaultAssignment(role: ApplicationRole): RolePermissionAssignment {
  return {
    roleId: role,
    permissions: [...defaultRolePermissions[role]],
    version: 0,
    updatedAt: null,
    updatedBy: null,
    source: "default",
  };
}

function getRoleView(
  role: ApplicationRole,
  assignment: RolePermissionAssignment,
  memberCount: number,
): RolePermissionView {
  const definition = applicationRoleDefinitions.find((item) => item.id === role);

  if (!definition) {
    throw new RolesPermissionsError("UNKNOWN_ROLE", "The application role is not supported.");
  }

  return {
    ...assignment,
    roleName: definition.label,
    description: definition.description,
    memberCount,
  };
}

export async function getRolesPermissionsData(): Promise<RolesPermissionsData> {
  const [assignments, users] = await Promise.all([
    Promise.all(applicationRoleDefinitions.map(async (role) => (
      await getRolePermissionAssignment(role.id) ?? defaultAssignment(role.id)
    ))),
    listApplicationUsers(),
  ]);

  const roles = assignments.map((assignment) => getRoleView(
    assignment.roleId,
    assignment,
    users.filter((user) => user.role === assignment.roleId).length,
  ));

  return {
    roles,
    permissions: permissionCatalog.slice(),
    summary: {
      roleCount: roles.length,
      permissionCount: permissionCatalog.length,
      assignedPermissionCount: roles.reduce((total, role) => total + role.permissions.length, 0),
    },
  };
}

function validatePermissions(value: unknown): PermissionKey[] {
  if (!Array.isArray(value)) {
    throw new RolesPermissionsError("INVALID_PERMISSIONS", "A permission list is required.");
  }

  if (value.some((permission) => typeof permission !== "string" || !getPermissionDefinition(permission as PermissionKey))) {
    throw new RolesPermissionsError("UNKNOWN_PERMISSION", "The permission list contains an unsupported permission key.");
  }

  if (new Set(value).size !== value.length) {
    throw new RolesPermissionsError("DUPLICATE_PERMISSION", "The permission list contains duplicate keys.");
  }

  const permissions = value as PermissionKey[];
  const permissionSet = new Set(permissions);

  for (const permission of permissions) {
    const definition = getPermissionDefinition(permission);
    if (!definition) {
      throw new RolesPermissionsError("UNKNOWN_PERMISSION", "The permission list contains an unsupported permission key.");
    }
    for (const dependency of definition.dependsOn ?? []) {
      if (!permissionSet.has(dependency)) {
        throw new RolesPermissionsError(
          "PERMISSION_DEPENDENCY_MISSING",
          `${definition.label} requires ${getPermissionDefinition(dependency)?.label ?? dependency}.`,
        );
      }
    }
  }

  return permissions;
}

export async function updateRolePermissions(input: {
  actor: Pick<SessionUser, "uid" | "displayName" | "role">;
  roleId: string;
  permissions: unknown;
  expectedVersion?: number;
}): Promise<RolePermissionView> {
  if (!isApplicationRole(input.roleId)) {
    throw new RolesPermissionsError("UNKNOWN_ROLE", "The application role is not supported.");
  }

  const permissions = validatePermissions(input.permissions);
  if (input.roleId === "admin" && reservedPermissionsForAdmin.some((permission) => !permissions.includes(permission))) {
    throw new RolesPermissionsError(
      "ADMIN_LOCKOUT_PREVENTED",
      "IT Administrator must retain the required Roles & Permissions and User Accounts management path.",
      409,
    );
  }

  const current = await getRolePermissionAssignment(input.roleId) ?? defaultAssignment(input.roleId);
  let saved: RolePermissionAssignment;
  try {
    saved = await updateRolePermissionAssignment({
      role: input.roleId,
      permissions,
      expectedVersion: input.expectedVersion,
      updatedBy: {
        uid: input.actor.uid,
        displayName: input.actor.displayName,
      },
    });
  } catch (error) {
    if (error instanceof RolePermissionConflictError) {
      throw new RolesPermissionsError(
        "ROLE_PERMISSION_CONFLICT",
        "These permissions changed since you opened the page. Refresh and review the latest configuration before saving.",
        409,
      );
    }
    throw error;
  }

  const currentSet = new Set(current.permissions);
  const savedSet = new Set(saved.permissions);
  const addedPermissions = saved.permissions.filter((permission) => !currentSet.has(permission));
  const removedPermissions = current.permissions.filter((permission) => !savedSet.has(permission));
  await writeAdminAuditEvent({
    action: "role_permissions_updated",
    module: "roles-permissions",
    actor: input.actor,
    target: {
      type: "application-role",
      id: input.roleId,
      label: applicationRoleDefinitions.find((role) => role.id === input.roleId)?.label ?? input.roleId,
    },
    metadata: {
      addedPermissions,
      removedPermissions,
      version: saved.version,
    },
  });

  const users = await listApplicationUsers();
  return getRoleView(
    saved.roleId,
    saved,
    users.filter((user) => user.role === saved.roleId).length,
  );
}
