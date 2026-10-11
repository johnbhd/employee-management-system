"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

import { formatCampusNavbarDate } from "@/lib/campus-time";
import { logoutFromFirebaseSession } from "@/lib/auth/client-session";
import { getAuthenticatedDisplayName } from "@/lib/auth/display-name";
import type { SessionUser } from "@/types/auth";
import type { EmployeeReference } from "@/types/employee";

import { Icon } from "../../ui/Icon";

function getPayrollPageTitle(pathname: string) {
  switch (pathname) {
    case "/payroll/dashboard":
      return "Payroll Dashboard";
    case "/payroll/verified-attendance":
      return "Verified Attendance";
    case "/payroll/batches":
      return "Payroll Batches";
    case "/payroll/handoff":
      return "Payroll Handoff";
    case "/payroll/results":
      return "Payroll Results";
    case "/payroll/history":
      return "Payroll History";
    default:
      return "Payroll Operations";
  }
}

type PayrollNavbarProps = {
  user: SessionUser;
  employee: EmployeeReference | null;
  onOpenSidebar: () => void;
};

export function PayrollNavbar({ user, employee, onOpenSidebar }: PayrollNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [campusNow, setCampusNow] = useState<Date | null>(null);
  const [feedback, setFeedback] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const pageTitle = getPayrollPageTitle(pathname);
  const displayName = getAuthenticatedDisplayName(user, employee);

  useEffect(() => {
    function updateCampusTime() {
      setCampusNow(new Date());
    }

    updateCampusTime();
    const interval = window.setInterval(updateCampusTime, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        profileTriggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  function notify(message: string) {
    setProfileOpen(false);
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  }

  function handleLogout(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setProfileOpen(false);
    void logoutFromFirebaseSession().then(() => router.replace("/"));
  }

  return (
    <header className="payroll-navbar" aria-label="Payroll Staff header">
      <div className="payroll-navbar-inner">
        <div className="payroll-navbar-title-wrap">
          <button type="button" className="payroll-menu-button" onClick={onOpenSidebar} aria-label="Open payroll navigation">
            <Icon name="menu" />
          </button>
          <div className="payroll-navbar-title">
            <strong>{pageTitle}</strong>
            <span>Payroll operations workspace</span>
          </div>
        </div>

        <div className="payroll-navbar-actions">
          <span className="payroll-progress-badge">Payroll Staff</span>
          <button type="button" className="payroll-icon-button payroll-search-button" onClick={() => notify("Payroll search is not connected in the prototype.")} aria-label="Search payroll workspace">
            <Icon name="search" />
          </button>
          {campusNow ? (
            <span className="payroll-date"><Icon name="calendar" />{formatCampusNavbarDate(campusNow)}</span>
          ) : null}
          <button type="button" className="payroll-icon-button payroll-notification-button" onClick={() => notify("No new payroll notifications.")} aria-label="View payroll notifications">
            <Icon name="bell" /><span>2</span>
          </button>
          <button type="button" className="payroll-icon-button payroll-help-button" onClick={() => notify("Payroll help center is a prototype action.")} aria-label="Open payroll help">
            <Icon name="help" />
          </button>
          <div className="payroll-profile-wrap" ref={profileRef}>
            <button
              type="button"
              className="payroll-profile-trigger"
              ref={profileTriggerRef}
              onClick={() => setProfileOpen((open) => !open)}
              aria-label="Open Payroll Staff account menu"
              aria-controls="payroll-profile-menu"
              aria-expanded={profileOpen}
            >
              <span className="payroll-account-avatar"><Icon name="user" /></span>
              <span className="payroll-profile-copy"><strong>{displayName}</strong><small>AU-JSC Payroll</small></span>
              <Icon name="chevron" />
            </button>
            {profileOpen ? (
              <nav id="payroll-profile-menu" className="payroll-profile-menu" aria-label="Payroll Staff account menu">
                <strong>{displayName}</strong>
                <small>Payroll operations access</small>
                <button type="button" onClick={() => notify("Payroll settings are not connected in the prototype.")}>
                  <Icon name="settings" />Settings
                </button>
                <Link href="/" onClick={handleLogout}><Icon name="logout" />Log out</Link>
              </nav>
            ) : null}
          </div>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">{feedback}</span>
    </header>
  );
}
