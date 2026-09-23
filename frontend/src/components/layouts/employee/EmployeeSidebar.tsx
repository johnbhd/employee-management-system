"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "../../ui/Icon";

type EmployeeSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const employeeLinks = [
  { label: "Dashboard", icon: "dashboard" as const, href: "/employee/dashboard" },
  { label: "My Attendance", icon: "calendar" as const, href: "/employee/my-attendance" },
  { label: "Show Attendance QR", icon: "qr" as const, href: "/employee/attendance-qr" },
  { label: "Attendance History", icon: "clock" as const, href: "/employee/attendance-history" },
  { label: "My Payslips", icon: "payroll" as const },
  { label: "My Profile", icon: "user" as const },
  { label: "Announcements", icon: "activity" as const },
  { label: "Help and Support", icon: "help" as const },
];

export function EmployeeSidebar({ isOpen, onClose }: EmployeeSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <button type="button" className={`employee-sidebar-overlay ${isOpen ? "is-visible" : ""}`} onClick={onClose} aria-label="Close employee navigation" />
      <aside className={`employee-sidebar ${isOpen ? "is-open" : ""}`} aria-label="Employee navigation">
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
        <Link href="/" className="employee-logout" onClick={onClose}>
          <Icon name="logout" />
          Log out
        </Link>
      </aside>
    </>
  );
}
