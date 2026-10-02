import type { ReactNode } from "react";

import type { SessionUser } from "@/types/auth";

import { HrShell } from "./HrShell";

type HrLayoutProps = {
  children: ReactNode;
  user: SessionUser;
};

export function HrLayout({ children, user }: HrLayoutProps) {
  return <HrShell user={user}>{children}</HrShell>;
}
