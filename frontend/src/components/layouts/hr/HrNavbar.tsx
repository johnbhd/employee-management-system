"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Icon } from "../../ui/Icon";

type HrNavbarProps = {
  onOpenSidebar: () => void;
};

export function HrNavbar({ onOpenSidebar }: HrNavbarProps) {
  const [feedback, setFeedback] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const pageTitle = pathname === "/hr/dashboard" ? "HR / Attendance Dashboard" : "Attendance Operations";

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

  return (
    <header className="hr-navbar" aria-label="HR and Attendance Staff header">
      <div className="hr-navbar-inner">
        <div className="hr-navbar-title-wrap">
          <button type="button" className="hr-menu-button" onClick={onOpenSidebar} aria-label="Open HR navigation">
            <Icon name="menu" />
          </button>
          <div className="hr-navbar-title">
            <strong>{pageTitle}</strong>
            <span>Attendance operations workspace</span>
          </div>
        </div>

        <div className="hr-navbar-actions">
          <span className="hr-date"><Icon name="calendar" /> September 16, 2026 · Wednesday</span>
          <button type="button" className="hr-icon-button hr-notification-button" onClick={() => notify("No new HR notifications.")} aria-label="View HR notifications">
            <Icon name="bell" />
            <span>3</span>
          </button>
          <button type="button" className="hr-icon-button hr-help-button" onClick={() => notify("HR help center is a prototype action.")} aria-label="Open HR help">
            <Icon name="help" />
          </button>
          <div className="hr-profile-wrap" ref={profileRef}>
            <button
              type="button"
              className="hr-profile-trigger"
              ref={profileTriggerRef}
              onClick={() => setProfileOpen((open) => !open)}
              aria-label="Open HR staff account menu"
              aria-controls="hr-profile-menu"
              aria-expanded={profileOpen}
            >
              <span className="hr-account-avatar"><Icon name="user" /></span>
              <span className="hr-profile-copy">
                <strong>HR / Attendance Staff</strong>
                <small>AU-JSC Operations</small>
              </span>
              <Icon name="chevron" />
            </button>
            {profileOpen ? (
              <nav id="hr-profile-menu" className="hr-profile-menu" aria-label="HR staff account menu">
                <strong>HR / Attendance Staff</strong>
                <small>Attendance operations access</small>
                <button type="button" onClick={() => notify("HR settings are not connected in the prototype.")}>
                  <Icon name="settings" />
                  Settings
                </button>
                <Link href="/" onClick={() => setProfileOpen(false)}>
                  <Icon name="logout" />
                  Log out
                </Link>
              </nav>
            ) : null}
          </div>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">{feedback}</span>
    </header>
  );
}
