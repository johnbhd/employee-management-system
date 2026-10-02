import type { ReactNode } from "react";

import { AccountingLayout } from "@/components/layouts/accounting/AccountingLayout";
import { requireRole } from "@/server/auth/guards";

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await requireRole("accounting");

  return <AccountingLayout user={user}>{children}</AccountingLayout>;
}
