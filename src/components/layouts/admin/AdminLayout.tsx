import type { ReactNode } from "react";

import type { CurrentUserContext } from "@/types/auth";

import { AdminShell } from "./AdminShell";

type AdminLayoutProps = {
  children: ReactNode;
  context: CurrentUserContext;
};

export function AdminLayout({ children, context }: AdminLayoutProps) {
  return <AdminShell context={context}>{children}</AdminShell>;
}
