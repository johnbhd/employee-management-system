"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { formatCampusNavbarDate } from "@/lib/campus-time";
import { logoutFromPrototype } from "@/lib/auth-flash-toast";

import { Icon } from "../../ui/Icon";

type AccountingNavbarProps = {
  onOpenSidebar: () => void;
};

type AccountingNotification = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

const accountingNotifications: AccountingNotification[] = [
  {
    id: "attention",
    title: "Transfers need review",
    detail: "Two approved payroll transfers are waiting in Integration Status.",
    href: "/accounting/integration-status",
  },
  {
    id: "sync",
    title: "Synchronization history updated",
    detail: "The latest accounting handoff is available for review.",
    href: "/accounting/integration-status",
  },
];

function getAccountingPageTitle(pathname: string) {
  switch (pathname) {
    case "/accounting/integration-status":
      return "Accounting Integration Status";
    default:
      return "Accounting Dashboard";
  }
}

export function AccountingNavbar({ onOpenSidebar }: AccountingNavbarProps) {
  const pathname = usePathname();
  const [campusNow, setCampusNow] = useState<Date | null>(null);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState(pathname);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const notificationTriggerRef = useRef<HTMLButtonElement>(null);
  const notificationMenuOpenedFromProfileRef = useRef(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const pageTitle = getAccountingPageTitle(pathname);
  const notificationMenuIsOpen = notificationMenuOpen && menuPathname === pathname;
  const profileMenuIsOpen = profileMenuOpen && menuPathname === pathname;
  const notificationBadge = String(accountingNotifications.length);

  useEffect(() => {
    function updateCampusTime() {
      setCampusNow(new Date());
    }

    updateCampusTime();
    const interval = window.setInterval(updateCampusTime, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!notificationMenuIsOpen && !profileMenuIsOpen) {
      return;
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node;
      const clickedNotificationMenu = notificationMenuRef.current?.contains(target);
      const clickedProfileMenu = profileMenuRef.current?.contains(target);

      if (!clickedNotificationMenu && !clickedProfileMenu) {
        setNotificationMenuOpen(false);
        setProfileMenuOpen(false);
        notificationMenuOpenedFromProfileRef.current = false;
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      const focusTarget = notificationMenuOpenedFromProfileRef.current
        ? profileTriggerRef.current
        : notificationMenuIsOpen
          ? notificationTriggerRef.current
          : profileTriggerRef.current;

      setNotificationMenuOpen(false);
      setProfileMenuOpen(false);
      notificationMenuOpenedFromProfileRef.current = false;
      focusTarget?.focus();
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationMenuIsOpen, profileMenuIsOpen]);

  function closeMenus() {
    setNotificationMenuOpen(false);
    setProfileMenuOpen(false);
    notificationMenuOpenedFromProfileRef.current = false;
  }

  function toggleNotificationMenu() {
    notificationMenuOpenedFromProfileRef.current = false;
    setMenuPathname(pathname);
    setNotificationMenuOpen(!notificationMenuIsOpen);
    setProfileMenuOpen(false);
  }

  function toggleProfileMenu() {
    notificationMenuOpenedFromProfileRef.current = false;
    setMenuPathname(pathname);
    setProfileMenuOpen(!profileMenuIsOpen);
    setNotificationMenuOpen(false);
  }

  function openNotificationMenu() {
    notificationMenuOpenedFromProfileRef.current = true;
    setMenuPathname(pathname);
    setProfileMenuOpen(false);
    setNotificationMenuOpen(true);
  }

  function handleLogout() {
    logoutFromPrototype();
    closeMenus();
  }

  return (
    <header className="accounting-navbar" aria-label="Accounting Staff header">
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
          <h1>{pageTitle}</h1>
        </div>
      </div>

      <div className="accounting-navbar-actions">
        <span className="accounting-date">
          <Icon name="calendar" />
          {campusNow ? formatCampusNavbarDate(campusNow) : "Loading date"}
        </span>

        <div
          className={`accounting-notification-wrap ${notificationMenuIsOpen ? "is-open" : ""}`}
          ref={notificationMenuRef}
        >
          <button
            type="button"
            ref={notificationTriggerRef}
            className="accounting-icon-button accounting-notification-button"
            onClick={toggleNotificationMenu}
            aria-label="Open accounting notifications"
            aria-controls="accounting-notification-menu"
            aria-expanded={notificationMenuIsOpen}
            aria-haspopup="menu"
          >
            <Icon name="bell" />
            <span>{notificationBadge}</span>
          </button>

          {notificationMenuIsOpen ? (
            <div
              id="accounting-notification-menu"
              className="accounting-notification-menu"
              role="menu"
              aria-label="Accounting notifications"
            >
              <div className="accounting-notification-menu-header">
                <strong>Notifications</strong>
                <span>{accountingNotifications.length} available</span>
              </div>
              {accountingNotifications.map((notification) => (
                <Link
                  href={notification.href}
                  className="accounting-notification-item"
                  key={notification.id}
                  onClick={closeMenus}
                  role="menuitem"
                >
                  <span className="accounting-notification-icon" aria-hidden="true">
                    <Icon name="info" />
                  </span>
                  <span className="accounting-notification-copy">
                    <strong>{notification.title}</strong>
                    <small>{notification.detail}</small>
                  </span>
                </Link>
              ))}
              <Link
                href="/accounting/integration-status"
                className="accounting-notification-view-all"
                onClick={closeMenus}
                role="menuitem"
              >
                View integration status
                <Icon name="arrow" />
              </Link>
            </div>
          ) : null}
        </div>

        <div className="accounting-profile-wrap" ref={profileMenuRef}>
          <button
            type="button"
            ref={profileTriggerRef}
            className="accounting-profile-trigger"
            onClick={toggleProfileMenu}
            aria-label="Open Accounting Staff profile menu"
            aria-controls="accounting-profile-menu"
            aria-expanded={profileMenuIsOpen}
            aria-haspopup="menu"
          >
            <span className="accounting-account-avatar">
              <Icon name="user" />
            </span>
            <span className="accounting-profile-copy">
              <strong>Accounting Staff</strong>
              <small>AU-JSC Accounting</small>
            </span>
            <Icon name="chevron" />
          </button>

          {profileMenuIsOpen ? (
            <nav
              id="accounting-profile-menu"
              className="accounting-profile-menu"
              aria-label="Accounting Staff profile menu"
            >
              <div className="accounting-profile-menu-summary">
                <strong>Accounting Staff</strong>
                <span>Accounting account</span>
              </div>
              <Link
                href="/accounting/dashboard"
                className="accounting-profile-menu-item"
                onClick={closeMenus}
              >
                <Icon name="dashboard" />
                <span>Dashboard</span>
              </Link>
              <button
                type="button"
                className="accounting-profile-menu-item"
                onClick={openNotificationMenu}
              >
                <Icon name="bell" />
                <span>Notifications</span>
                <strong className="accounting-profile-menu-count">{notificationBadge}</strong>
              </button>
              <Link
                href="/accounting/integration-status"
                className="accounting-profile-menu-item"
                onClick={closeMenus}
              >
                <Icon name="accounting" />
                <span>Integration status</span>
              </Link>
              <Link
                href="/"
                className="accounting-profile-menu-item accounting-profile-menu-item-danger"
                onClick={handleLogout}
              >
                <Icon name="logout" />
                <span>Log out</span>
              </Link>
            </nav>
          ) : null}
        </div>
      </div>
    </header>
  );
}
