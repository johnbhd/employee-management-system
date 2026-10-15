"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type { CurrentUserContext } from "@/types/auth";
import type { PermissionKey } from "@/types/permissions";

import { PayrollMain } from "./PayrollMain";
import { PayrollNavbar } from "./PayrollNavbar";
import { PayrollSidebar } from "./PayrollSidebar";

type PayrollShellProps = {
  children: ReactNode;
  context: CurrentUserContext;
  permissions: readonly PermissionKey[];
};

export function PayrollShell({ children, context, permissions }: PayrollShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="payroll-shell">
      <PayrollSidebar
        user={context.user}
        employee={context.employee}
        permissions={permissions}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="payroll-main-wrap">
        <PayrollNavbar
          user={context.user}
          employee={context.employee}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <PayrollMain>{children}</PayrollMain>
      </div>
    </div>
  );
}
