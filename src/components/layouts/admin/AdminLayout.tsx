import type { ReactNode } from "react";

import type { CurrentUserContext } from "@/types/auth";
import type { PermissionKey } from "@/types/permissions";

import { AdminShell } from "./AdminShell";

type AdminLayoutProps = {
  children: ReactNode;
  context: CurrentUserContext;
  permissions: readonly PermissionKey[];
};

export function AdminLayout({ children, context, permissions }: AdminLayoutProps) {
  return <AdminShell context={context} permissions={permissions}>{children}</AdminShell>;
}
