import type { ReactNode } from "react";

import { EmployeeLayout } from "@/components/layouts/employee/EmployeeLayout";
import { requireRoleContext } from "@/server/auth/guards";

export default async function Layout({ children }: { children: ReactNode }) {
  const context = await requireRoleContext("employee");

  return <EmployeeLayout context={context}>{children}</EmployeeLayout>;
}
