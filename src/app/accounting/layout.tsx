import type { ReactNode } from "react";

import { AccountingLayout } from "@/components/layouts/accounting/AccountingLayout";
import { requireRoleContext } from "@/server/auth/guards";
import { getPermissionsForUser } from "@/server/auth/permission.service";

export default async function Layout({ children }: { children: ReactNode }) {
  const context = await requireRoleContext("accounting");
  const permissions = await getPermissionsForUser(context.user);

  return <AccountingLayout context={context} permissions={permissions}>{children}</AccountingLayout>;
}
