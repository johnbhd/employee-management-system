import { redirect } from "next/navigation";

import { RolesPermissionsPage } from "@/components/admin/roles-permissions/RolesPermissionsPage";
import { hasPermission } from "@/server/auth/permission.service";
import { getRolesPermissionsData } from "@/server/admin/roles-permissions.service";
import { requireRoleContext } from "@/server/auth/guards";
import type { RolesPermissionsData } from "@/types/permissions";

export const dynamic = "force-dynamic";

const emptyData: RolesPermissionsData = {
  roles: [],
  permissions: [],
  summary: {
    roleCount: 0,
    permissionCount: 0,
    assignedPermissionCount: 0,
    configurationStatus: "attention",
    configurationIssues: [],
    latestUpdatedAt: null,
  },
};

export default async function Page() {
  const context = await requireRoleContext("admin");
  const canView = await hasPermission(context.user, "admin.roles_permissions.view");

  if (!canView) {
    redirect("/admin/dashboard");
  }

  let data = emptyData;
  let loadError = false;

  try {
    data = await getRolesPermissionsData();
  } catch {
    loadError = true;
  }

  return <RolesPermissionsPage initialData={loadError ? null : data} loadError={loadError} canManage={await hasPermission(context.user, "admin.roles_permissions.manage")} />;
}
