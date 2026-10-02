import type { ReactNode } from "react";

import type { CurrentUserContext } from "@/types/auth";

import { EmployeeShell } from "./EmployeeShell";

type EmployeeLayoutProps = {
  children: ReactNode;
  context: CurrentUserContext;
};

export function EmployeeLayout({ children, context }: EmployeeLayoutProps) {
  return <EmployeeShell context={context}>{children}</EmployeeShell>;
}
