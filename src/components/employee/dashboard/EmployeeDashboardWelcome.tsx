"use client";

import { useEffect, useState } from "react";

import {
  formatCampusNavbarDate,
  formatCampusTime,
} from "@/lib/campus-time";

export function EmployeeDashboardWelcome() {
  const [campusNow, setCampusNow] = useState<Date | null>(null);

  useEffect(() => {
    const initialUpdateId = window.setTimeout(() => {
      setCampusNow(new Date());
    }, 0);
    const intervalId = window.setInterval(() => {
      setCampusNow(new Date());
    }, 60_000);

    return () => {
      window.clearTimeout(initialUpdateId);
      window.clearInterval(intervalId);
    };
  }, []);

  const currentDateTime = campusNow
    ? `${formatCampusNavbarDate(campusNow)} · ${formatCampusTime(campusNow)}`
    : "Loading date and time";

  return (
    <section className="employee-welcome">
      <div>
        <p className="employee-welcome-kicker">{currentDateTime}</p>
        <h2>Welcome back, John Benedict!</h2>
        <p>Here is your employee dashboard for today.</p>
        <p className="muted">
          Employee ID: <strong>AU-EMP-2026-001</strong> · Information Technology
        </p>
      </div>
    </section>
  );
}
