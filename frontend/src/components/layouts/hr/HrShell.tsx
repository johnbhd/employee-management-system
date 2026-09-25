"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { HrMain } from "./HrMain";
import { HrNavbar } from "./HrNavbar";
import { HrSidebar } from "./HrSidebar";

type HrShellProps = {
  children: ReactNode;
};

export function HrShell({ children }: HrShellProps) {
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
    <div className="hr-shell">
      <HrSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="hr-main-wrap">
        <HrNavbar onOpenSidebar={() => setSidebarOpen(true)} />
        <HrMain>{children}</HrMain>
      </div>
    </div>
  );
}
