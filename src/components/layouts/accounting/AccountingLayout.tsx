import type { ReactNode } from "react";

import type { CurrentUserContext } from "@/types/auth";
import type { PermissionKey } from "@/types/permissions";

import { AccountingShell } from "./AccountingShell";

type AccountingLayoutProps = {
  children: ReactNode;
  context: CurrentUserContext;
  permissions: readonly PermissionKey[];
};

export function AccountingLayout({ children, context, permissions }: AccountingLayoutProps) {
  return <AccountingShell context={context} permissions={permissions}>{children}</AccountingShell>;
}
