import type { ReactNode } from "react";

import { AdminLayout } from "@/components/layouts/admin/AdminLayout";
import { requireRoleContext } from "@/server/auth/guards";

export default async function Layout({ children }: { children: ReactNode }) {
  const context = await requireRoleContext("admin");

  return <AdminLayout context={context}>{children}</AdminLayout>;
}
