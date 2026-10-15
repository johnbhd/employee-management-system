import type { ReactNode } from "react";

import type { CurrentUserContext } from "@/types/auth";
import type { PermissionKey } from "@/types/permissions";

import { PayrollShell } from "./PayrollShell";

type PayrollLayoutProps = {
  children: ReactNode;
  context: CurrentUserContext;
  permissions: readonly PermissionKey[];
};

export function PayrollLayout({ children, context, permissions }: PayrollLayoutProps) {
  return <PayrollShell context={context} permissions={permissions}>{children}</PayrollShell>;
}
