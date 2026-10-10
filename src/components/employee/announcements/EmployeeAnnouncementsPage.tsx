import { Suspense } from "react";

import { announcements } from "@/data/employee";

import { AnnouncementsExplorer } from "./AnnouncementsExplorer";

export function EmployeeAnnouncementsPage() {
  return (
    <div className="employee-announcements-page">
      <header className="employee-announcements-heading">
        <span className="employee-announcements-heading-label">Campus updates</span>
        <p>Stay updated with important campus notices, payroll announcements, and employee reminders.</p>
      </header>

      <Suspense fallback={null}>
        <AnnouncementsExplorer announcements={announcements} />
      </Suspense>
    </div>
  );
}
