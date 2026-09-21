"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Icon } from "../../ui/Icon";

type AdminNavbarProps = {
  searchOpen: boolean;
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
};

export function AdminNavbar({ searchOpen, onOpenSidebar, onOpenSearch, onCloseSearch }: AdminNavbarProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (searchOpen) {
      searchRef.current?.focus();
      searchRef.current?.select();
    }
  }, [searchOpen]);

  function notify(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2200);
  }

  return (
    <header className="admin-navbar" aria-label="Administration header">
      <div className={`admin-navbar-inner ${searchOpen ? "search-is-open" : ""}`}>
        <div className="admin-navbar-normal">
          <button type="button" className="icon-button sidebar-open-button" onClick={onOpenSidebar} aria-label="Open navigation menu">
            <Icon name="menu" />
          </button>
          <div className="navbar-title">
            <strong>IT Administrator Dashboard</strong>
            <span>Integration control center</span>
          </div>
          <label className="desktop-search">
            <span className="sr-only">Search dashboard</span>
            <Icon name="search" />
            <input type="search" placeholder="Search dashboard" aria-label="Search dashboard" />
            <kbd>Ctrl K</kbd>
          </label>
          <div className="system-status compact-status">
            <span className="status-dot status-success" />
            <strong>5 / 6</strong>
          </div>
          <button type="button" className="icon-button search-trigger" onClick={onOpenSearch} aria-label="Open search">
            <Icon name="search" />
          </button>
          <button type="button" className="icon-button notification-button" onClick={() => notify("No new notifications.")} aria-label="View notifications">
            <Icon name="bell" />
            <span>3</span>
          </button>
          <button type="button" className="icon-button help-button" onClick={() => notify("Help center is a prototype action.")} aria-label="Open help">
            <Icon name="help" />
          </button>
          <div className="profile-wrap">
            <button type="button" className="profile-trigger" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}>
              <span className="account-avatar"><Icon name="user" /></span>
              <span className="profile-copy"><strong>Administrator</strong><small>IT Administrator</small></span>
              <Icon name="chevron" />
            </button>
            {profileOpen ? (
              <div className="profile-menu">
                <strong>Administrator account</strong>
                <small>AU-JSC integration access</small>
                <button type="button" onClick={() => notify("Account settings are not connected in the prototype.")}><Icon name="settings" />Account settings</button>
                <Link href="/"><Icon name="logout" />Logout</Link>
              </div>
            ) : null}
          </div>
        </div>
        <div className={`mobile-search-mode ${searchOpen ? "is-open" : ""}`}>
          <label>
            <span className="sr-only">Search dashboard</span>
            <Icon name="search" />
            <input ref={searchRef} type="search" placeholder="Search dashboard" aria-label="Search dashboard" />
            <button type="button" onClick={onCloseSearch} aria-label="Close search"><Icon name="close" /></button>
          </label>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">{feedback}</span>
    </header>
  );
}
