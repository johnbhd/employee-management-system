import { Icon } from "@/components/ui/Icon";
import type {
  AttendanceHistoryData,
  AttendanceHistoryQuery,
} from "@/types/attendance-history";
import type { EmployeeReference } from "@/types/employee";

import { AttendanceHistoryExplorer } from "./AttendanceHistoryExplorer";

export function AttendanceHistoryPage({
  attendanceLoadError,
  attendanceData,
  employee,
  query,
}: {
  attendanceLoadError: boolean;
  attendanceData: AttendanceHistoryData;
  employee: EmployeeReference | null;
  query: AttendanceHistoryQuery;
}) {
  const stats = getAttendanceHistoryStats(attendanceData, attendanceLoadError);

  return (
    <div className="attendance-history-page">
      <div className="attendance-history-heading">
        <span className="attendance-history-heading-label">My attendance</span>
        <p>Review your recorded attendance for the selected period.</p>
      </div>

      <section className="attendance-history-stat-grid" aria-label="Monthly attendance summary">
        {stats.map((stat) => (
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

      <AttendanceHistoryExplorer
        key={`${query.status ?? "all"}-${query.month}-${query.date}-${query.page}-${query.pageSize}`}
        attendanceLoadError={attendanceLoadError}
        attendanceData={attendanceData}
        employee={employee}
        query={query}
      />
    </div>
  );
}

function getAttendanceHistoryStats(
  data: AttendanceHistoryData,
  attendanceLoadError: boolean,
) {
  if (attendanceLoadError) {
    return [
      { label: "Days Present", value: "—", unit: "", note: "Unavailable", icon: "calendar" as const, tone: "info" as const },
      { label: "Days Late", value: "—", unit: "", note: "Not available", icon: "clock" as const, tone: "warning" as const },
      { label: "Days Absent", value: "—", unit: "", note: "Not available", icon: "close" as const, tone: "danger" as const },
      { label: "Overtime Hours", value: "—", unit: "", note: "Not available", icon: "clock" as const, tone: "info" as const },
    ];
  }

  return [
    { label: "Days Present", value: String(data.totalRecords), unit: "days", note: "All available records", icon: "calendar" as const, tone: "info" as const },
    { label: "Days Late", value: "—", unit: "", note: "Schedule data unavailable", icon: "clock" as const, tone: "warning" as const },
    { label: "Days Absent", value: "—", unit: "", note: "Schedule data unavailable", icon: "close" as const, tone: "danger" as const },
    { label: "Overtime Hours", value: "—", unit: "", note: "Policy data unavailable", icon: "clock" as const, tone: "info" as const },
  ];
}
