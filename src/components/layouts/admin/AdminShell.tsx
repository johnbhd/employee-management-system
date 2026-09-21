"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { AdminMain } from "./AdminMain";
import { AdminNavbar } from "./AdminNavbar";
import { AdminSidebar } from "./AdminSidebar";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="admin-shell">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main-wrap">
        <AdminNavbar
          searchOpen={searchOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onCloseSearch={() => setSearchOpen(false)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <AdminMain>{children}</AdminMain>
      </div>
    </div>
  );
}
