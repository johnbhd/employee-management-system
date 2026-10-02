import type { ReactNode } from "react";

type AccountingMainProps = {
  children: ReactNode;
};

export function AccountingMain({ children }: AccountingMainProps) {
  return <main className="accounting-content">{children}</main>;
}
