"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { logoutFromFirebaseSession } from "@/lib/auth/client-session";
import { getAuthenticatedDisplayName } from "@/lib/auth/display-name";
import type { SessionUser } from "@/types/auth";
import type { EmployeeReference } from "@/types/employee";
import type { IconName } from "@/types/ui";

import { Icon } from "../../ui/Icon";

type PayrollNavigationItem = {
  id: string;
  label: string;
  icon: IconName;
  href?: string;
  planned?: boolean;
};

const payrollNavigation: readonly PayrollNavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/payroll/dashboard" },
  { id: "verified-attendance", label: "Verified Attendance", icon: "users", href: "/payroll/verified-attendance" },
  { id: "batches", label: "Payroll Batches", icon: "layers", href: "/payroll/batches" },
  { id: "handoff", label: "Payroll Handoff", icon: "handoff", href: "/payroll/handoff" },
  { id: "results", label: "Payroll Results", icon: "file", href: "/payroll/results" },
  { id: "history", label: "Payroll History", icon: "clock", planned: true },
];

type PayrollSidebarProps = {
  user: SessionUser;
  employee: EmployeeReference | null;
  isOpen: boolean;
  onClose: () => void;
};

export function PayrollSidebar({ user, employee, isOpen, onClose }: PayrollSidebarProps) {
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
      <button
        type="button"
        className={`payroll-sidebar-overlay ${isOpen ? "is-visible" : ""}`}
        onClick={onClose}
        aria-label="Close payroll navigation"
      />
      <aside className={`payroll-sidebar ${isOpen ? "is-open" : ""}`} aria-label="Payroll Staff navigation">
        <div className="payroll-sidebar-inner">
          <div className="payroll-sidebar-header">
            <Link href="/payroll/dashboard" className="payroll-brand" onClick={onClose}>
              <Image src="/images/aulogo.png" alt="Arellano University logo" width={44} height={44} priority />
              <span>
                <strong>ARELLANO UNIVERSITY</strong>
                <small>Juan Sumulong Campus</small>
              </span>
            </Link>
            <button type="button" className="payroll-sidebar-close" onClick={onClose} aria-label="Close payroll navigation">
              <Icon name="close" />
            </button>
          </div>

          <div className="payroll-sidebar-scroll">
            <div className="payroll-workspace-label">
              <span>Payroll Operations</span>
              <span className="payroll-role-pill">{displayName}</span>
            </div>
            <nav className="payroll-sidebar-nav" aria-label="Payroll portal navigation">
              {payrollNavigation.map((item) => {
                const active = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : false;
                const content = (
                  <>
                    <Icon name={item.icon} />
                    <span className="payroll-nav-copy">
                      <span>{item.label}</span>
                      {item.planned ? <small>Planned</small> : null}
                    </span>
                  </>
                );

                return item.href ? (
                  <Link
                    href={item.href}
                    className={`payroll-nav-link ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    key={item.id}
                    onClick={onClose}
                  >
                    {content}
                  </Link>
                ) : (
                  <span className="payroll-nav-link payroll-nav-placeholder" key={item.id} aria-disabled="true">
                    {content}
                  </span>
                );
              })}
            </nav>

            <div className="payroll-sidebar-status">
              <div>
                <span className="payroll-status-dot" aria-hidden="true" />
                <span>Simulated status</span>
              </div>
              <strong>Payroll Handoff</strong>
              <p>HR-verified attendance is prepared here before controlled transfer to the Existing Payroll System.</p>
            </div>
          </div>

          <div className="payroll-sidebar-footer">
            <div className="payroll-sidebar-account">
              <span className="payroll-account-avatar"><Icon name="user" /></span>
              <span>
                <strong>{displayName}</strong>
                <small>AU-JSC Payroll Account</small>
              </span>
            </div>
            <Link href="/" className="payroll-sidebar-logout" onClick={handleLogout}>
              <Icon name="logout" />
              Log out
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
