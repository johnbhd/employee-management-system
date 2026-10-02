import type { ReactNode } from "react";

import { AccountingShell } from "./AccountingShell";

type AccountingLayoutProps = {
  children: ReactNode;
};

export function AccountingLayout({ children }: AccountingLayoutProps) {
  return <AccountingShell>{children}</AccountingShell>;
}
