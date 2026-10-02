import type { ReactNode } from "react";

import { AdminLayout } from "@/components/layouts/admin/AdminLayout";
import { requireRole } from "@/server/auth/guards";

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await requireRole("admin");

  return <AdminLayout user={user}>{children}</AdminLayout>;
}
