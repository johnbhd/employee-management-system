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
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const pageTitle = pathname === "/employee/my-attendance"
    ? "My Attendance"
    : pathname === "/employee/attendance-qr"
      ? "Attendance QR"
      : pathname === "/employee/attendance-history"
        ? "Attendance History"
        : pathname === "/employee/profile"
          ? "My Profile"
          : "Employee Dashboard";

  useEffect(() => {
    if (!accountMenuOpen) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
        accountTriggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  function notify(message: string) {
    setAccountMenuOpen(false);
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  }

  return (
    <header className="employee-navbar">
      <div className="employee-navbar-title">
        <button type="button" className="employee-menu-button" onClick={onOpenSidebar} aria-label="Open employee navigation"><Icon name="menu" /></button>
        <h1>{pageTitle}</h1>
      </div>
      <div className="employee-navbar-actions">
        <span className="employee-date"><Icon name="calendar" /> July 23, 2026 · Thursday</span>
        <button type="button" className="employee-icon-button" onClick={() => notify("You have 3 notifications.")} aria-label="Notifications"><Icon name="bell" /><span>3</span></button>
        <button type="button" className="employee-icon-button" onClick={() => notify("Help center is a prototype action.")} aria-label="Help"><Icon name="help" /></button>
        <button type="button" className="employee-icon-button" onClick={() => notify("Theme preferences are not connected in the prototype.")} aria-label="Theme"><Icon name="sun" /></button>
        <span className="employee-user-chip"><Icon name="user" /> John Benedict <Icon name="chevron" /></span>
        <div className="employee-mobile-account" ref={accountMenuRef}>
          <button
            type="button"
            ref={accountTriggerRef}
            className="employee-mobile-account-button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-label="Open account menu"
            aria-controls="employee-account-menu"
            aria-expanded={accountMenuOpen}
          >
            <Icon name="user" />
          </button>
          {accountMenuOpen ? (
            <nav id="employee-account-menu" className="employee-account-menu" aria-label="Employee account menu">
              <div className="employee-account-menu-summary">
                <strong>John Benedict</strong>
                <span>Employee account</span>
              </div>
              <Link href="/employee/profile" className="employee-account-menu-item" onClick={() => setAccountMenuOpen(false)}>
                <Icon name="user" />
                <span>My Profile</span>
              </Link>
              <button type="button" className="employee-account-menu-item" onClick={() => notify("You have 3 notifications.")}>
                <Icon name="bell" />
                <span>Notifications</span>
                <strong className="employee-account-menu-count">3</strong>
              </button>
              <button type="button" className="employee-account-menu-item" onClick={() => notify("Account settings are not connected in the prototype.")}>
                <Icon name="settings" />
                <span>Settings</span>
              </button>
              <Link href="/" className="employee-account-menu-item employee-account-menu-item-danger" onClick={() => setAccountMenuOpen(false)}>
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
