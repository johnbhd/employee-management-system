"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { Icon } from "../../ui/Icon";

type EmployeeNavbarProps = {
  onOpenSidebar: () => void;
};

export function EmployeeNavbar({ onOpenSidebar }: EmployeeNavbarProps) {
  const [feedback, setFeedback] = useState("");
  const pathname = usePathname();
  const pageTitle = pathname === "/employee/my-attendance"
    ? "My Attendance"
    : pathname === "/employee/attendance-qr"
      ? "Attendance QR"
      : pathname === "/employee/attendance-history"
        ? "Attendance History"
      : "Employee Dashboard";

  function notify(message: string) {
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
        <span className="employee-date"><Icon name="calendar" /> July 23, 2026 · Wednesday</span>
        <button type="button" className="employee-icon-button" onClick={() => notify("You have 3 notifications.")} aria-label="Notifications"><Icon name="bell" /><span>3</span></button>
        <button type="button" className="employee-icon-button" onClick={() => notify("Help center is a prototype action.")} aria-label="Help"><Icon name="help" /></button>
        <button type="button" className="employee-icon-button" onClick={() => notify("Theme preferences are not connected in the prototype.")} aria-label="Theme"><Icon name="sun" /></button>
        <span className="employee-user-chip"><Icon name="user" /> John Benedict <Icon name="chevron" /></span>
      </div>
      <span className="sr-only" aria-live="polite">{feedback}</span>
    </header>
  );
}
