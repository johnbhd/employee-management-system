import {
  applicationRoleDefinitions,
  permissionCatalog,
} from "@/lib/auth/permissions";
import type {
  ApplicationRoleDefinition,
  PermissionDefinition,
} from "@/types/permissions";

export type { ApplicationRoleDefinition as RoleDefinition } from "@/types/permissions";
export type { PermissionDefinition } from "@/types/permissions";

export const permissionDefinitions: readonly PermissionDefinition[] = permissionCatalog;
export const roleDefinitions: readonly ApplicationRoleDefinition[] = applicationRoleDefinitions;
export const permissionCategoryOrder = [
  ...new Set(permissionCatalog.map((permission) => permission.category)),
];
