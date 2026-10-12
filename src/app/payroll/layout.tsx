import type { ReactNode } from "react";

import { PayrollLayout } from "@/components/layouts/payroll/PayrollLayout";
import { requireRoleContext } from "@/server/auth/guards";
import { getPermissionsForUser } from "@/server/auth/permission.service";

export default async function Layout({ children }: { children: ReactNode }) {
  const context = await requireRoleContext("payroll");
  const permissions = await getPermissionsForUser(context.user);

  return <PayrollLayout context={context} permissions={permissions}>{children}</PayrollLayout>;
}
