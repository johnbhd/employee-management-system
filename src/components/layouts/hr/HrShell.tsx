"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type { SessionUser } from "@/types/auth";

import { HrMain } from "./HrMain";
import { HrNavbar } from "./HrNavbar";
import { HrSidebar } from "./HrSidebar";
import { HrWorkflowProvider } from "./HrWorkflowContext";

type HrShellProps = {
  children: ReactNode;
  user: SessionUser;
};

export function HrShell({ children, user }: HrShellProps) {
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
          user={user}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="hr-main-wrap">
          <HrNavbar
            user={user}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
          <HrMain>{children}</HrMain>
        </div>
      </div>
    </HrWorkflowProvider>
  );
}
