import type { ReactNode } from "react";

import { HrShell } from "./HrShell";

type HrLayoutProps = {
  children: ReactNode;
};

export function HrLayout({ children }: HrLayoutProps) {
  return <HrShell>{children}</HrShell>;
}
