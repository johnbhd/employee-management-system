import type { ReactNode } from "react";

import { HrLayout } from "@/components/layouts/hr/HrLayout";
import { requireRoleContext } from "@/server/auth/guards";

export default async function Layout({ children }: { children: ReactNode }) {
  const context = await requireRoleContext("hr");

  return <HrLayout context={context}>{children}</HrLayout>;
}
