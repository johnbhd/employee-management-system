import type { ReactNode } from "react";

import type { CurrentUserContext } from "@/types/auth";
import type { PermissionKey } from "@/types/permissions";

import { HrShell } from "./HrShell";

type HrLayoutProps = {
  children: ReactNode;
  context: CurrentUserContext;
  permissions: readonly PermissionKey[];
};

export function HrLayout({ children, context, permissions }: HrLayoutProps) {
  return <HrShell context={context} permissions={permissions}>{children}</HrShell>;
}
