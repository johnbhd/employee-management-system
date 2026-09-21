import type { ReactNode } from "react";

import { EmployeeLayout } from "@/components/layouts/employee/EmployeeLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <EmployeeLayout>{children}</EmployeeLayout>;
}
