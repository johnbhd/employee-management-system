import type { ReactNode } from "react";

import type { SessionUser } from "@/types/auth";

import { AccountingShell } from "./AccountingShell";

type AccountingLayoutProps = {
  children: ReactNode;
  user: SessionUser;
};

export function AccountingLayout({ children, user }: AccountingLayoutProps) {
  return <AccountingShell user={user}>{children}</AccountingShell>;
}
