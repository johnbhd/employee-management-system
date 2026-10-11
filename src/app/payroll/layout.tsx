import type { ReactNode } from "react";

import { PayrollLayout } from "@/components/layouts/payroll/PayrollLayout";
import { requireRoleContext } from "@/server/auth/guards";

export default async function Layout({ children }: { children: ReactNode }) {
  const context = await requireRoleContext("payroll");

  return <PayrollLayout context={context}>{children}</PayrollLayout>;
}
