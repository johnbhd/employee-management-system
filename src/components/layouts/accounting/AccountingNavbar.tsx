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

type AccountingNavbarProps = {
  user: SessionUser;
  employee: EmployeeReference | null;
  onOpenSidebar: () => void;
};

function getAccountingPageTitle(pathname: string) {
  switch (pathname) {
    case "/accounting/dashboard":
      return "Accounting Dashboard";
    case "/accounting/integration-status":
      return "Accounting Integration Status";
    case "/accounting/transaction-history":
      return "Transaction History";
    default:
      return "Accounting Operations";
  }
}

export function AccountingNavbar({ user, employee, onOpenSidebar }: AccountingNavbarProps) {
  const [campusNow, setCampusNow] = useState<Date | null>(null);
  const [feedback, setFeedback] = useState("");
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const pageTitle = getAccountingPageTitle(pathname);
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
    if (!profileOpen) {
      return;
    }

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
    <header className="accounting-navbar" aria-label="Accounting Staff header">
      <div className="accounting-navbar-inner">
        <div className="accounting-navbar-title-wrap">
          <button
            type="button"
            className="accounting-menu-button"
            onClick={onOpenSidebar}
            aria-label="Open accounting navigation"
          >
            <Icon name="menu" />
          </button>
          <div className="accounting-navbar-title">
            <strong>{pageTitle}</strong>
            <span>Accounting integration workspace</span>
          </div>
        </div>

        <div className="accounting-navbar-actions">
          <span className="accounting-progress-badge">5 / 6</span>
          <button
            type="button"
            className="accounting-icon-button accounting-search-button"
            onClick={() => notify("Accounting search is not connected in the prototype.")}
            aria-label="Search accounting workspace"
          >
            <Icon name="search" />
          </button>
          {campusNow ? (
            <span className="accounting-date">
              <Icon name="calendar" />
              {formatCampusNavbarDate(campusNow)}
            </span>
          ) : null}
          <button
            type="button"
            className="accounting-icon-button accounting-notification-button"
            onClick={() => notify("No new accounting notifications.")}
            aria-label="View accounting notifications"
          >
            <Icon name="bell" />
            <span>3</span>
          </button>
          <button
            type="button"
            className="accounting-icon-button accounting-help-button"
            onClick={() => notify("Accounting help center is a prototype action.")}
            aria-label="Open accounting help"
          >
            <Icon name="help" />
          </button>
          <div className="accounting-profile-wrap" ref={profileRef}>
            <button
              type="button"
              className="accounting-profile-trigger"
              ref={profileTriggerRef}
              onClick={() => setProfileOpen((open) => !open)}
              aria-label="Open Accounting Staff account menu"
              aria-controls="accounting-profile-menu"
              aria-expanded={profileOpen}
            >
              <span className="accounting-account-avatar">
                <Icon name="user" />
              </span>
              <span className="accounting-profile-copy">
                <strong>{displayName}</strong>
                <small>AU-JSC Accounting</small>
              </span>
              <Icon name="chevron" />
            </button>
            {profileOpen ? (
              <nav
                id="accounting-profile-menu"
                className="accounting-profile-menu"
                aria-label="Accounting Staff account menu"
              >
                <strong>{displayName}</strong>
                <small>Accounting integration access</small>
                <button type="button" onClick={() => notify("Accounting settings are not connected in the prototype.")}>
                  <Icon name="settings" />
                  Settings
                </button>
                <Link href="/" onClick={handleLogout}>
                  <Icon name="logout" />
                  Log out
                </Link>
              </nav>
            ) : null}
          </div>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {feedback}
      </span>
    </header>
  );
}
