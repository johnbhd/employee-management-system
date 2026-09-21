import type { ReactNode } from "react";

type EmployeeMainProps = {
  children: ReactNode;
};

export function EmployeeMain({ children }: EmployeeMainProps) {
  return <main className="employee-content">{children}</main>;
}
