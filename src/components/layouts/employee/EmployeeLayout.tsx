import type { ReactNode } from "react";

import type { CurrentUserContext } from "@/types/auth";
import type { PermissionKey } from "@/types/permissions";

import { EmployeeShell } from "./EmployeeShell";

type EmployeeLayoutProps = {
  children: ReactNode;
  context: CurrentUserContext;
  permissions: readonly PermissionKey[];
};

export function EmployeeLayout({ children, context, permissions }: EmployeeLayoutProps) {
  return <EmployeeShell context={context} permissions={permissions}>{children}</EmployeeShell>;
}
