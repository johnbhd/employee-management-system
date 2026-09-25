import type { ReactNode } from "react";

type HrMainProps = {
  children: ReactNode;
};

export function HrMain({ children }: HrMainProps) {
  return <main className="hr-content">{children}</main>;
}
