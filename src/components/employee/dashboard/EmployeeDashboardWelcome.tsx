"use client";

import { useEffect, useState } from "react";

import {
  formatCampusNavbarDate,
  formatCampusTime,
} from "@/lib/campus-time";
import type { EmployeeReference } from "@/types/employee";

export function EmployeeDashboardWelcome({
  employee,
}: {
  employee: EmployeeReference;
}) {
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
        <h2>
          Welcome back, {employee.displayName}!
        </h2>
        <p>Here is your employee dashboard for today.</p>
        <p className="muted">
          Position: <strong>{employee.position ?? "Not provided"}</strong>
          <br />
          Employee ID: <strong>{employee.employeeId}</strong>
          {` · ${employee.department}`}
        </p>
      </div>
    </section>
  );
}
