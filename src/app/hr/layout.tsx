import type { ReactNode } from "react";

import { HrLayout } from "@/components/layouts/hr/HrLayout";
import { requireRole } from "@/server/auth/guards";

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await requireRole("hr");

  return <HrLayout user={user}>{children}</HrLayout>;
}
