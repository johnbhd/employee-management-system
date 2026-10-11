import type { ReactNode } from "react";

import type { CurrentUserContext } from "@/types/auth";

import { PayrollShell } from "./PayrollShell";

type PayrollLayoutProps = {
  children: ReactNode;
  context: CurrentUserContext;
};

export function PayrollLayout({ children, context }: PayrollLayoutProps) {
  return <PayrollShell context={context}>{children}</PayrollShell>;
}
