"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/Icon";
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

  const currentDate = campusNow
    ? formatCampusNavbarDate(campusNow)
    : "Loading date";
  const currentTime = campusNow
    ? formatCampusTime(campusNow)
    : "Loading time";

  return (
    <section
      className="employee-welcome"
      aria-labelledby="employee-dashboard-heading"
    >
      <div className="employee-welcome-copy">
        <p className="employee-welcome-kicker">Employee self-service</p>
        <h2 id="employee-dashboard-heading">
          Good day, {employee.displayName}
        </h2>
        <p className="employee-welcome-message">
          Here&apos;s your attendance overview for today.
        </p>
        <p className="employee-welcome-identity">
          <strong>{employee.employeeId}</strong>
          <span className="employee-welcome-separator" aria-hidden="true">
            /
          </span>
          <span>{employee.department}</span>
          <span className="employee-welcome-separator" aria-hidden="true">
            /
          </span>
          <span>{employee.position ?? "Position not provided"}</span>
        </p>
      </div>
      <div
        className="employee-welcome-meta"
        aria-label="Current campus date and time"
      >
        <span>
          <Icon name="calendar" />
          {currentDate}
        </span>
        <strong>{currentTime}</strong>
      </div>
    </section>
  );
}
