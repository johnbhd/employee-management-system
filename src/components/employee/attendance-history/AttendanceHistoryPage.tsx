import { Icon } from "@/components/ui/Icon";
import { attendanceHistoryStats } from "@/data/attendance-history";
import type { EmployeeReference } from "@/types/employee";

import { AttendanceHistoryExplorer } from "./AttendanceHistoryExplorer";

export function AttendanceHistoryPage({
  employee,
}: {
  employee: EmployeeReference | null;
}) {
  return (
    <div className="attendance-history-page">
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

      <AttendanceHistoryExplorer employee={employee} />
    </div>
  );
}
