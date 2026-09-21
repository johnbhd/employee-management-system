import type { ReactNode } from "react";

type AdminMainProps = {
  children: ReactNode;
};

export function AdminMain({ children }: AdminMainProps) {
  return <main className="admin-content">{children}</main>;
}
