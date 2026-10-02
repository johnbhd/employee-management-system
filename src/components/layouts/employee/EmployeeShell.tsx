"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import type { SessionUser } from "@/types/auth";

import { EmployeeMain } from "./EmployeeMain";
import { EmployeeNavbar } from "./EmployeeNavbar";
import { EmployeeSidebar } from "./EmployeeSidebar";

type EmployeeShellProps = {
  children: ReactNode;
  user: SessionUser;
};

export function EmployeeShell({ children, user }: EmployeeShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="employee-shell">
      <EmployeeSidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="employee-main-wrap">
        <EmployeeNavbar
          user={user}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <EmployeeMain>{children}</EmployeeMain>
      </div>
    </div>
  );
}
