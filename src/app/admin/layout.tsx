import type { ReactNode } from "react";

import { AdminLayout } from "@/components/layouts/admin/AdminLayout";
import { requireRoleContext } from "@/server/auth/guards";
import { getPermissionsForUser } from "@/server/auth/permission.service";

export default async function Layout({ children }: { children: ReactNode }) {
  const context = await requireRoleContext("admin");
  const permissions = await getPermissionsForUser(context.user);

  return <AdminLayout context={context} permissions={permissions}>{children}</AdminLayout>;
}
