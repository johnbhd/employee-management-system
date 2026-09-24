import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { attendanceHistoryStats } from "@/data/attendance-history";

import { AttendanceHistoryExplorer } from "./AttendanceHistoryExplorer";

export function AttendanceHistoryPage() {
  return (
    <div className="attendance-history-page">
      <nav className="attendance-history-breadcrumb" aria-label="Breadcrumb">
        <Link href="/employee/dashboard">Dashboard</Link>
        <Icon name="chevron" />
        <span aria-current="page">Attendance History</span>
      </nav>

      <div className="attendance-history-heading">
        <span className="attendance-history-heading-label">My attendance</span>
        <p>Review your recorded attendance for the selected period.</p>
      </div>

      <section className="attendance-history-stat-grid" aria-label="Monthly attendance summary">
        {attendanceHistoryStats.map((stat) => (
          <article className="attendance-history-stat-card" key={stat.label}>
            <div className={`attendance-history-stat-icon attendance-history-stat-icon-${stat.tone}`} aria-hidden="true">
              <Icon name={stat.icon} />
            </div>
            <div>
              <p className="attendance-history-stat-label">{stat.label}</p>
              <p className="attendance-history-stat-value">
                {stat.value} <span>{stat.unit}</span>
              </p>
              <p className="attendance-history-stat-note">{stat.note}</p>
            </div>
          </article>
        ))}
      </section>

      <AttendanceHistoryExplorer />
    </div>
  );
}
