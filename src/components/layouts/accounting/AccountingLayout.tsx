import type { ReactNode } from "react";

import type { CurrentUserContext } from "@/types/auth";

import { AccountingShell } from "./AccountingShell";

type AccountingLayoutProps = {
  children: ReactNode;
  context: CurrentUserContext;
};

export function AccountingLayout({ children, context }: AccountingLayoutProps) {
  return <AccountingShell context={context}>{children}</AccountingShell>;
}
