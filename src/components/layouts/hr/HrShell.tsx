"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type { CurrentUserContext } from "@/types/auth";
import type { PermissionKey } from "@/types/permissions";

import { HrMain } from "./HrMain";
import { HrNavbar } from "./HrNavbar";
import { HrSidebar } from "./HrSidebar";
import { HrWorkflowProvider } from "./HrWorkflowContext";

type HrShellProps = {
  children: ReactNode;
  context: CurrentUserContext;
  permissions: readonly PermissionKey[];
};

export function HrShell({ children, context, permissions }: HrShellProps) {
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
    <HrWorkflowProvider>
      <div className="hr-shell">
        <HrSidebar
          user={context.user}
          employee={context.employee}
          permissions={permissions}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="hr-main-wrap">
          <HrNavbar
            user={context.user}
            employee={context.employee}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
          <HrMain>{children}</HrMain>
        </div>
      </div>
    </HrWorkflowProvider>
  );
}
