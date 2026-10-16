"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { logoutFromFirebaseSession } from "@/lib/auth/client-session";
import { getAuthenticatedDisplayName } from "@/lib/auth/display-name";
import type { SessionUser } from "@/types/auth";
import type { EmployeeReference } from "@/types/employee";
import type { PermissionKey } from "@/types/permissions";

import { Icon } from "../../ui/Icon";

type EmployeeSidebarProps = {
  user: SessionUser;
  employee: EmployeeReference | null;
  permissions: readonly PermissionKey[];
  isOpen: boolean;
  onClose: () => void;
};

const employeeLinks: readonly { label: string; icon: "dashboard" | "calendar" | "qr" | "clock" | "payroll" | "user" | "settings"; href: string; permission?: PermissionKey }[] = [
  { label: "Dashboard", icon: "dashboard", href: "/employee/dashboard", permission: "employee.dashboard.view" },
  { label: "My Attendance", icon: "calendar", href: "/employee/my-attendance", permission: "employee.attendance.view_own" },
  { label: "Show Attendance QR", icon: "qr", href: "/employee/attendance-qr", permission: "employee.attendance_qr.view_own" },
  { label: "Attendance History", icon: "clock", href: "/employee/attendance-history", permission: "employee.attendance.history.view_own" },
  { label: "My Payslips", icon: "payroll", href: "/employee/payslips", permission: "employee.payslip.view_own" },
  { label: "My Profile", icon: "user", href: "/employee/profile", permission: "employee.profile.view_own" },
  { label: "Settings", icon: "settings" as const, href: "/employee/settings" },
];

export function EmployeeSidebar({ user, employee, permissions, isOpen, onClose }: EmployeeSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const displayName = getAuthenticatedDisplayName(user, employee);

  function handleLogout(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    onClose();
    void logoutFromFirebaseSession().then(() => router.replace("/"));
  }

  return (
    <>
      <button type="button" className={`employee-sidebar-overlay ${isOpen ? "is-visible" : ""}`} onClick={onClose} aria-label="Close employee navigation" />
      <aside
        className={`employee-sidebar ${isOpen ? "is-open" : ""}`}
        aria-label={`${displayName} navigation`}
      >
        <div className="employee-brand">
          <Image src="/images/aulogo.png" alt="Arellano University logo" width={48} height={48} priority />
          <span><strong>Arellano University</strong><small>Juan Sumulong Campus</small></span>
        </div>
        <nav className="employee-nav" aria-label="Employee portal navigation">
          {employeeLinks.filter((item) => !item.permission || permissions.includes(item.permission)).map((item) => {
            const isActive = item.href === pathname;
            const className = `employee-nav-link ${isActive ? "is-active" : ""}`;
            const content = (
              <>
                <Icon name={item.icon} />
                {item.label}
              </>
            );

            return item.href ? (
              <Link
                href={item.href}
                className={className}
                key={item.label}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
              >
                {content}
              </Link>
            ) : (
              <span className={className} key={item.label}>
                {content}
              </span>
            );
          })}
        </nav>
        <Link href="/" className="employee-logout" onClick={handleLogout}>
          <Icon name="logout" />
          Log out
        </Link>
      </aside>
    </>
  );
}
