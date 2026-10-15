import type { ReactNode } from "react";

export function PayrollMain({ children }: { children: ReactNode }) {
  return <main className="payroll-content">{children}</main>;
}
