import type { ReactNode } from "react";

import { AccountingLayout } from "@/components/layouts/accounting/AccountingLayout";
import { requireRoleContext } from "@/server/auth/guards";

export default async function Layout({ children }: { children: ReactNode }) {
  const context = await requireRoleContext("accounting");

  return <AccountingLayout context={context}>{children}</AccountingLayout>;
}
