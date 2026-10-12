import type { ReactNode } from "react";

import { HrLayout } from "@/components/layouts/hr/HrLayout";
import { requireRoleContext } from "@/server/auth/guards";
import { getPermissionsForUser } from "@/server/auth/permission.service";

export default async function Layout({ children }: { children: ReactNode }) {
  const context = await requireRoleContext("hr");
  const permissions = await getPermissionsForUser(context.user);

  return <HrLayout context={context} permissions={permissions}>{children}</HrLayout>;
}
