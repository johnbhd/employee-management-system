"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import type { CurrentUserContext } from "@/types/auth";
import type { PermissionKey } from "@/types/permissions";

import { AdminMain } from "./AdminMain";
import { AdminNavbar } from "./AdminNavbar";
import { AdminSidebar } from "./AdminSidebar";

type AdminShellProps = {
  children: ReactNode;
  context: CurrentUserContext;
  permissions: readonly PermissionKey[];
};

export function AdminShell({ children, context, permissions }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-shell">
      <AdminSidebar
        user={context.user}
        employee={context.employee}
        permissions={permissions}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="admin-main-wrap">
        <AdminNavbar
          user={context.user}
          employee={context.employee}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <AdminMain>{children}</AdminMain>
      </div>
    </div>
  );
}
