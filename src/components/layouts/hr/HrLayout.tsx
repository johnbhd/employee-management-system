import type { ReactNode } from "react";

import type { CurrentUserContext } from "@/types/auth";

import { HrShell } from "./HrShell";

type HrLayoutProps = {
  children: ReactNode;
  context: CurrentUserContext;
};

export function HrLayout({ children, context }: HrLayoutProps) {
  return <HrShell context={context}>{children}</HrShell>;
}
