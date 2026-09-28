"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { announcements, getLatestAnnouncements } from "@/data/employee";
import { formatCampusNavbarDate } from "@/lib/campus-time";
import { logoutFromPrototype } from "@/lib/auth-flash-toast";

import { Icon } from "../../ui/Icon";

type EmployeeNavbarProps = {
  onOpenSidebar: () => void;
};

function getEmployeePageTitle(pathname: string) {
  switch (pathname) {
    case "/employee/my-attendance":
      return "My Attendance";
    case "/employee/attendance-qr":
      return "Attendance QR";
    case "/employee/attendance-history":
      return "Attendance History";
    case "/employee/payslips":
      return "My Payslips";
    case "/employee/profile":
      return "My Profile";
    case "/employee/announcements":
      return "Announcements";
    case "/employee/help-support":
      return "Help & Support";
    default:
      return "Employee Dashboard";
  }
}

const latestNotifications = getLatestAnnouncements(5);
const notificationCount = announcements.length;
const notificationBadge = notificationCount > 9 ? "9+" : String(notificationCount);

export function EmployeeNavbar({ onOpenSidebar }: EmployeeNavbarProps) {
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
  const pageTitle = getEmployeePageTitle(pathname);
  const notificationMenuIsOpen = notificationMenuOpen && menuPathname === pathname;
  const profileMenuIsOpen = profileMenuOpen && menuPathname === pathname;

  useEffect(() => {
    function updateCampusTime() {
      setCampusNow(new Date());
    }

    updateCampusTime();
    const interval = window.setInterval(updateCampusTime, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!notificationMenuIsOpen && !profileMenuIsOpen) return;

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
          : notificationMenuIsOpen
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
    setProfileMenuOpen(false);
  }

  return (
    <header className="employee-navbar">
      <div className="employee-navbar-title">
        <button type="button" className="employee-menu-button" onClick={onOpenSidebar} aria-label="Open employee navigation"><Icon name="menu" /></button>
        <h1>{pageTitle}</h1>
      </div>
      <div className="employee-navbar-actions">
        <span className="employee-date">
          <Icon name="calendar" />
          {campusNow ? formatCampusNavbarDate(campusNow) : "Loading date"}
        </span>
        <div className={`employee-notification-wrap ${notificationMenuIsOpen ? "is-open" : ""}`} ref={notificationMenuRef}>
          <button
            type="button"
            ref={notificationTriggerRef}
            className="employee-icon-button employee-notification-button"
            onClick={toggleNotificationMenu}
            aria-label="Open notifications"
            aria-controls="employee-notification-menu"
            aria-expanded={notificationMenuIsOpen}
            aria-haspopup="menu"
          >
            <Icon name="bell" />
            <span>{notificationBadge}</span>
          </button>
          {notificationMenuIsOpen ? (
            <div id="employee-notification-menu" className="employee-notification-menu" role="menu" aria-label="Employee notifications">
              <div className="employee-notification-menu-header">
                <strong>Notifications</strong>
                <span>{notificationCount} available</span>
              </div>
              {latestNotifications.length > 0 ? (
                latestNotifications.map((announcement) => (
                  <Link
                    href={{
                      pathname: "/employee/announcements",
                      query: { announcement: announcement.id },
                    }}
                    className="employee-notification-item"
                    key={announcement.id}
                    onClick={closeMenus}
                    role="menuitem"
                    aria-label={`Open announcement: ${announcement.title}`}
                  >
                    <span
                      className={`employee-notification-icon ${announcement.tone}`}
                      aria-hidden="true"
                    >
                      <Icon name="info" />
                    </span>
                    <span className="employee-notification-copy">
                      <strong>{announcement.title}</strong>
                      <small className="employee-notification-meta">
                        {announcement.category} ·{" "}
                        <time dateTime={announcement.postedAt}>{announcement.date}</time>
                      </small>
                      <small className="employee-notification-preview">
                        {announcement.message}
                      </small>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="employee-notification-empty">No notifications available.</p>
              )}
              <Link
                href="/employee/announcements"
                className="employee-notification-view-all"
                onClick={closeMenus}
                role="menuitem"
              >
                View all
                <Icon name="arrow" />
              </Link>
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
            aria-expanded={profileMenuIsOpen}
            aria-haspopup="menu"
          >
            <span className="employee-user-avatar"><Icon name="user" /></span>
            <span className="employee-user-name">John Benedict</span>
            <Icon name="chevron" />
          </button>
          {profileMenuIsOpen ? (
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
                <strong className="employee-profile-menu-count">{notificationBadge}</strong>
              </button>
              <Link
                href="/employee/my-attendance"
                className="employee-profile-menu-item"
                onClick={() => setProfileMenuOpen(false)}
              >
                <Icon name="calendar" />
                <span>Calendar</span>
              </Link>

              <Link
                href="/"
                className="employee-profile-menu-item employee-profile-menu-item-danger"
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
