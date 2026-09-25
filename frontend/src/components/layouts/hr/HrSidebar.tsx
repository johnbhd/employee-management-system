"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "../../ui/Icon";

const hrNavigation = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" as const, href: "/hr/dashboard" },
  { id: "attendance-monitoring", label: "Attendance Monitoring", icon: "clock" as const, href: "/hr/attendance-monitoring" },
  { id: "correction-requests", label: "Correction Requests", icon: "comment" as const, href: "/hr/correction-requests" },
  { id: "employee-schedules", label: "Employee Schedules", icon: "calendar" as const, planned: true },
  { id: "employee-directory", label: "Employee Directory", icon: "users" as const, planned: true },
  { id: "attendance-reports", label: "Attendance Reports", icon: "file" as const, planned: true },
  { id: "audit-history", label: "Audit History", icon: "audit" as const, planned: true },
];

type HrSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function HrSidebar({ isOpen, onClose }: HrSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        className={`hr-sidebar-overlay ${isOpen ? "is-visible" : ""}`}
        onClick={onClose}
        aria-label="Close HR navigation"
      />
      <aside className={`hr-sidebar ${isOpen ? "is-open" : ""}`} aria-label="HR and Attendance Staff navigation">
        <div className="hr-sidebar-inner">
          <div className="hr-sidebar-header">
            <Link href="/hr/dashboard" className="hr-brand" onClick={onClose}>
              <Image src="/images/aulogo.png" alt="Arellano University logo" width={44} height={44} priority />
              <span>
                <strong>ARELLANO UNIVERSITY</strong>
                <small>Juan Sumulong Campus</small>
              </span>
            </Link>
            <button type="button" className="hr-sidebar-close" onClick={onClose} aria-label="Close HR navigation">
              <Icon name="close" />
            </button>
          </div>

          <div className="hr-sidebar-scroll">
            <div className="hr-workspace-label">
              <span>Attendance Operations</span>
              <span className="hr-role-pill">HR / Attendance Staff</span>
            </div>
            <nav className="hr-sidebar-nav" aria-label="HR portal navigation">
              {hrNavigation.map((item) => {
                const active = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : false;
                const content = (
                  <>
                    <Icon name={item.icon} />
                    <span className="hr-nav-copy">
                      <span>{item.label}</span>
                      {item.planned ? <small>Planned</small> : null}
                    </span>
                  </>
                );

                return item.href ? (
                  <Link
                    href={item.href}
                    className={`hr-nav-link ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    key={item.id}
                    onClick={onClose}
                  >
                    {content}
                  </Link>
                ) : (
                  <span className="hr-nav-link hr-nav-placeholder" key={item.id} aria-disabled="true">
                    {content}
                  </span>
                );
              })}
            </nav>
          </div>

          <div className="hr-sidebar-footer">
            <div className="hr-sidebar-note">
              <div>
                <span className="hr-note-dot" />
                <strong>Prototype workspace</strong>
              </div>
              <p>HRPS remains the source of truth for employee information.</p>
            </div>
            <div className="hr-sidebar-account">
              <span className="hr-account-avatar"><Icon name="user" /></span>
              <span>
                <strong>HR / Attendance Staff</strong>
                <small>AU-JSC Operations Account</small>
              </span>
            </div>
            <Link href="/" className="hr-sidebar-logout" onClick={onClose}>
              <Icon name="logout" />
              Log out
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
