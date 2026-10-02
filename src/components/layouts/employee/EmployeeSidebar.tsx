"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { logoutFromFirebaseSession } from "@/lib/auth/client-session";
import { getAuthenticatedDisplayName } from "@/lib/auth/display-name";
import type { SessionUser } from "@/types/auth";
import type { EmployeeReference } from "@/types/employee";

import { Icon } from "../../ui/Icon";

type EmployeeSidebarProps = {
  user: SessionUser;
  employee: EmployeeReference | null;
  isOpen: boolean;
  onClose: () => void;
};

const employeeLinks = [
  { label: "Dashboard", icon: "dashboard" as const, href: "/employee/dashboard" },
  { label: "My Attendance", icon: "calendar" as const, href: "/employee/my-attendance" },
  { label: "Show Attendance QR", icon: "qr" as const, href: "/employee/attendance-qr" },
  { label: "Attendance History", icon: "clock" as const, href: "/employee/attendance-history" },
  { label: "My Payslips", icon: "payroll" as const, href: "/employee/payslips" },
  { label: "My Profile", icon: "user" as const, href: "/employee/profile" },
  { label: "Announcements", icon: "activity" as const, href: "/employee/announcements" },
  { label: "Help and Support", icon: "help" as const, href: "/employee/help-support" },
];

export function EmployeeSidebar({ user, employee, isOpen, onClose }: EmployeeSidebarProps) {
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
          <Image src="/images/new-au-logo.png" alt="Arellano University seal" width={44} height={44} />
          <span><strong>Arellano University</strong><small>Juan Sumulong Campus</small></span>
        </div>
        <nav className="employee-nav" aria-label="Employee portal navigation">
          {employeeLinks.map((item) => {
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
