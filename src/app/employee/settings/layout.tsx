import type { ReactNode } from "react";

import { EmployeeLayout } from "@/components/layouts/employee/EmployeeLayout";
import { requireRoleContext } from "@/server/auth/guards";
import { getPermissionsForUser } from "@/server/auth/permission.service";

export default async function Layout({ children }: { children: ReactNode }) {
  const context = await requireRoleContext("employee", {
    allowMustChangePassword: true,
  });
  const permissions = await getPermissionsForUser(context.user);

  return (
    <EmployeeLayout context={context} permissions={permissions}>
      {children}
    </EmployeeLayout>
  );
}
