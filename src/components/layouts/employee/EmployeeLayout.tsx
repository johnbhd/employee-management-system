import type { ReactNode } from "react";

import { EmployeeShell } from "./EmployeeShell";

type EmployeeLayoutProps = {
  children: ReactNode;
};

export function EmployeeLayout({ children }: EmployeeLayoutProps) {
  return <EmployeeShell>{children}</EmployeeShell>;
}
