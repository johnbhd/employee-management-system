import type { ReactNode } from "react";

import type { SessionUser } from "@/types/auth";

import { EmployeeShell } from "./EmployeeShell";

type EmployeeLayoutProps = {
  children: ReactNode;
  user: SessionUser;
};

export function EmployeeLayout({ children, user }: EmployeeLayoutProps) {
  return <EmployeeShell user={user}>{children}</EmployeeShell>;
}
