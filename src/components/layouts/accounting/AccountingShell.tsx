"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type { SessionUser } from "@/types/auth";

import { AccountingMain } from "./AccountingMain";
import { AccountingNavbar } from "./AccountingNavbar";
import { AccountingSidebar } from "./AccountingSidebar";

type AccountingShellProps = {
  children: ReactNode;
  user: SessionUser;
};

export function AccountingShell({ children, user }: AccountingShellProps) {
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
    <div className="accounting-shell">
      <AccountingSidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="accounting-main-wrap">
        <AccountingNavbar
          user={user}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <AccountingMain>{children}</AccountingMain>
      </div>
    </div>
  );
}
