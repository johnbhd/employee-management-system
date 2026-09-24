import type { ReactNode } from "react";

import { HrLayout } from "@/components/layouts/hr/HrLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <HrLayout>{children}</HrLayout>;
}
