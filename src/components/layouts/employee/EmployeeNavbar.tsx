"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Icon } from "../../ui/Icon";

type EmployeeNavbarProps = {
  onOpenSidebar: () => void;
};

export function EmployeeNavbar({ onOpenSidebar }: EmployeeNavbarProps) {
  const [feedback, setFeedback] = useState("");
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const notificationTriggerRef = useRef<HTMLButtonElement>(null);
  const notificationMenuOpenedFromProfileRef = useRef(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const pageTitle = pathname === "/employee/my-attendance"
    ? "My Attendance"
    : pathname === "/employee/attendance-qr"
      ? "Attendance QR"
      : pathname === "/employee/attendance-history"
        ? "Attendance History"
        : pathname === "/employee/payslips"
          ? "My Payslips"
          : pathname === "/employee/profile"
            ? "My Profile"
            : "Employee Dashboard";

  useEffect(() => {
    if (!notificationMenuOpen && !profileMenuOpen) return;

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
      if (event.key === "Escape") {
        const focusTarget = notificationMenuOpenedFromProfileRef.current
          ? profileTriggerRef.current
          : notificationMenuOpen
            ? notificationTriggerRef.current
            : profileTriggerRef.current;

        setNotificationMenuOpen(false);
        setProfileMenuOpen(false);
        notificationMenuOpenedFromProfileRef.current = false;
        focusTarget?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationMenuOpen, profileMenuOpen]);

  function notify(message: string) {
    setNotificationMenuOpen(false);
    setProfileMenuOpen(false);
    notificationMenuOpenedFromProfileRef.current = false;
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  }

  function toggleNotificationMenu() {
    notificationMenuOpenedFromProfileRef.current = false;
    setNotificationMenuOpen((open) => !open);
    setProfileMenuOpen(false);
  }

  function toggleProfileMenu() {
    notificationMenuOpenedFromProfileRef.current = false;
    setProfileMenuOpen((open) => !open);
    setNotificationMenuOpen(false);
  }

  function openNotificationMenu() {
    notificationMenuOpenedFromProfileRef.current = true;
    setProfileMenuOpen(false);
    setNotificationMenuOpen(true);
  }

  return (
    <header className="employee-navbar">
      <div className="employee-navbar-title">
        <button type="button" className="employee-menu-button" onClick={onOpenSidebar} aria-label="Open employee navigation"><Icon name="menu" /></button>
        <h1>{pageTitle}</h1>
      </div>
      <div className="employee-navbar-actions">
        <span className="employee-date"><Icon name="calendar" /> July 23, 2026 · Thursday</span>
        <div className={`employee-notification-wrap ${notificationMenuOpen ? "is-open" : ""}`} ref={notificationMenuRef}>
          <button
            type="button"
            ref={notificationTriggerRef}
            className="employee-icon-button employee-notification-button"
            onClick={toggleNotificationMenu}
            aria-label="Open notifications"
            aria-controls="employee-notification-menu"
            aria-expanded={notificationMenuOpen}
            aria-haspopup="menu"
          >
            <Icon name="bell" />
            <span>3</span>
          </button>
          {notificationMenuOpen ? (
            <div id="employee-notification-menu" className="employee-notification-menu" role="menu" aria-label="Employee notifications">
              <div className="employee-notification-menu-header">
                <strong>Notifications</strong>
                <span>3 unread</span>
              </div>
              <button type="button" className="employee-notification-item" onClick={() => notify("Attendance notification opened.")} role="menuitem">
                <span className="employee-notification-dot" />
                <span>
                  <strong>Attendance recorded</strong>
                  <small>Your latest attendance entry is ready to review.</small>
                </span>
              </button>
              <button type="button" className="employee-notification-item" onClick={() => notify("Payslip notification opened.")} role="menuitem">
                <span className="employee-notification-dot" />
                <span>
                  <strong>Payslip available</strong>
                  <small>Your latest payslip is ready to view.</small>
                </span>
              </button>
              <button type="button" className="employee-notification-item" onClick={() => notify("Schedule notification opened.")} role="menuitem">
                <span className="employee-notification-dot" />
                <span>
                  <strong>Schedule reminder</strong>
                  <small>Review your assigned attendance schedule.</small>
                </span>
              </button>
            </div>
          ) : null}
        </div>
        <div className="employee-profile-wrap" ref={profileMenuRef}>
          <button
            type="button"
            ref={profileTriggerRef}
            className="employee-user-chip"
            onClick={toggleProfileMenu}
            aria-label="Open employee profile menu"
            aria-controls="employee-profile-menu"
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
          >
            <span className="employee-user-avatar"><Icon name="user" /></span>
            <span className="employee-user-name">John Benedict</span>
            <Icon name="chevron" />
          </button>
          {profileMenuOpen ? (
            <nav id="employee-profile-menu" className="employee-profile-menu" aria-label="Employee profile menu">
              <div className="employee-profile-menu-summary">
                <strong>John Benedict</strong>
                <span>Employee account</span>
              </div>
              <Link href="/employee/profile" className="employee-profile-menu-item" onClick={() => setProfileMenuOpen(false)}>
                <Icon name="user" />
                <span>Profile</span>
              </Link>
              <button type="button" className="employee-profile-menu-item" onClick={openNotificationMenu}>
                <Icon name="bell" />
                <span>Notifications</span>
                <strong className="employee-profile-menu-count">3</strong>
              </button>
              <button type="button" className="employee-profile-menu-item" onClick={() => notify("Calendar view is not connected in the prototype.")}>
                <Icon name="calendar" />
                <span>Calendar</span>
              </button>
              <Link href="/" className="employee-profile-menu-item employee-profile-menu-item-danger" onClick={() => setProfileMenuOpen(false)}>
                <Icon name="logout" />
                <span>Log out</span>
              </Link>
            </nav>
          ) : null}
        </div>
      </div>
      <span className="sr-only" aria-live="polite">{feedback}</span>
    </header>
  );
}
