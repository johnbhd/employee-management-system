"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { EmployeeMain } from "./EmployeeMain";
import { EmployeeNavbar } from "./EmployeeNavbar";
import { EmployeeSidebar } from "./EmployeeSidebar";

type EmployeeShellProps = {
  children: ReactNode;
};

export function EmployeeShell({ children }: EmployeeShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="employee-shell">
      <EmployeeSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="employee-main-wrap">
        <EmployeeNavbar onOpenSidebar={() => setSidebarOpen(true)} />
        <EmployeeMain>{children}</EmployeeMain>
      </div>
    </div>
  );
}
