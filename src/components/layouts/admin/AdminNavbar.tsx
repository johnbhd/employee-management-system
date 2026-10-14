"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { logoutFromFirebaseSession } from "@/lib/auth/client-session";
import { getAuthenticatedDisplayName } from "@/lib/auth/display-name";
import { getRoleLabel } from "@/lib/auth/roles";
import type { SessionUser } from "@/types/auth";
import type { EmployeeReference } from "@/types/employee";

import { Icon } from "../../ui/Icon";

type AdminNavbarProps = {
  user: SessionUser;
  employee: EmployeeReference | null;
  onOpenSidebar: () => void;
};

export function AdminNavbar({ user, employee, onOpenSidebar }: AdminNavbarProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const displayName = getAuthenticatedDisplayName(user, employee);

  function notify(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  }

  function handleLogout(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setProfileOpen(false);
    void logoutFromFirebaseSession().then(() => router.replace("/"));
  }

  return (
    <header className="admin-navbar" aria-label="Administration header">
      <div className="admin-navbar-inner">
        <div className="admin-navbar-normal">
          <button type="button" className="icon-button sidebar-open-button" onClick={onOpenSidebar} aria-label="Open navigation menu">
            <Icon name="menu" />
          </button>
          <div className="navbar-title">
            <strong>IT Administrator Dashboard</strong>
            <span>Integration control center</span>
          </div>
          <div className="system-status compact-status">
            <span className="status-dot status-success" />
            <strong>Configured</strong>
          </div>
          <button type="button" className="icon-button notification-button" onClick={() => notify("No new notifications.")} aria-label="View notifications">
            <Icon name="bell" />
            <span>3</span>
          </button>
          <Link
            href="/scanner"
            className="icon-button scanner-button"
            aria-label="Open QR scanner"
          >
            <Icon name="qr" />
          </Link>
          <div className="profile-wrap">
            <button type="button" className="profile-trigger" onClick={() => setProfileOpen((open) => !open)} aria-label="Open administrator profile menu" aria-expanded={profileOpen}>
              <span className="account-avatar"><Icon name="user" /></span>
              <span className="profile-copy"><strong>{displayName}</strong><small>{getRoleLabel(user.role)}</small></span>
              <Icon name="chevron" />
            </button>
            {profileOpen ? (
              <div className="profile-menu">
                <strong>{displayName} account</strong>
                <small>AU-JSC integration access</small>
                <button type="button" onClick={() => notify("Account settings are managed from System & Settings.")}><Icon name="settings" />Account settings</button>
                <Link href="/" onClick={handleLogout}>
                  <Icon name="logout" />
                  Logout
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">{feedback}</span>
    </header>
  );
}
