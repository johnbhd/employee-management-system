"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type { CurrentUserContext } from "@/types/auth";

import { PayrollMain } from "./PayrollMain";
import { PayrollNavbar } from "./PayrollNavbar";
import { PayrollSidebar } from "./PayrollSidebar";

export function PayrollShell({
  children,
  context,
}: {
  children: ReactNode;
  context: CurrentUserContext;
}) {
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
