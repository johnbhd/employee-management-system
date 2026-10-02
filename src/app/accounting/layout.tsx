import type { ReactNode } from "react";

import { AccountingLayout } from "@/components/layouts/accounting/AccountingLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <AccountingLayout>{children}</AccountingLayout>;
}
