import type { ReactNode } from "react";

import { EmployeeLayout } from "@/components/layouts/employee/EmployeeLayout";
import { requireRole } from "@/server/auth/guards";

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await requireRole("employee");

  return <EmployeeLayout user={user}>{children}</EmployeeLayout>;
}
