import type { ReactNode } from "react";

import type { SessionUser } from "@/types/auth";

import { AdminShell } from "./AdminShell";

type AdminLayoutProps = {
  children: ReactNode;
  user: SessionUser;
};

export function AdminLayout({ children, user }: AdminLayoutProps) {
  return <AdminShell user={user}>{children}</AdminShell>;
}
