"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import type { CurrentUserContext } from "@/types/auth";

import { EmployeeMain } from "./EmployeeMain";
import { EmployeeNavbar } from "./EmployeeNavbar";
import { EmployeeSidebar } from "./EmployeeSidebar";

type EmployeeShellProps = {
  children: ReactNode;
  context: CurrentUserContext;
};

export function EmployeeShell({ children, context }: EmployeeShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="employee-shell">
      <EmployeeSidebar
        user={context.user}
        employee={context.employee}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="employee-main-wrap">
        <EmployeeNavbar
          user={context.user}
          employee={context.employee}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <EmployeeMain>{children}</EmployeeMain>
      </div>
    </div>
  );
}
