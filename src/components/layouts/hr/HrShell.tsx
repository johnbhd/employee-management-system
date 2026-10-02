"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type { CurrentUserContext } from "@/types/auth";

import { HrMain } from "./HrMain";
import { HrNavbar } from "./HrNavbar";
import { HrSidebar } from "./HrSidebar";
import { HrWorkflowProvider } from "./HrWorkflowContext";

type HrShellProps = {
  children: ReactNode;
  context: CurrentUserContext;
};

export function HrShell({ children, context }: HrShellProps) {
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
