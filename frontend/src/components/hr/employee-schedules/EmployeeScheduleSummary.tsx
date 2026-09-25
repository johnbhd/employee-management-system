import { Icon } from "@/components/ui/Icon";
import type { IconName, StatusTone } from "@/types/ui";

import type { HrEmployeeScheduleRecord } from "@/data/hr-employee-schedules";

type EmployeeScheduleSummaryProps = {
  records: readonly HrEmployeeScheduleRecord[];
};

type SummaryMetric = {
  label: string;
  value: number;
  icon: IconName;
  tone: StatusTone;
};

export function EmployeeScheduleSummary({ records }: EmployeeScheduleSummaryProps) {
  const metrics: SummaryMetric[] = [
    {
      label: "Employees with schedule",
      value: records.filter((record) => Boolean(record.startTime && record.endTime)).length,
      icon: "calendar",
      tone: "info",
    },
    {
      label: "Active today",
      value: records.filter((record) => record.employmentStatus === "Active" && record.todayStatus === "Working Day").length,
      icon: "check",
      tone: "success",
    },
    {
      label: "Rest day today",
      value: records.filter((record) => record.todayStatus === "Rest Day").length,
      icon: "sun",
      tone: "muted",
    },
    {
      label: "Leave / holiday",
      value: records.filter((record) => record.todayStatus === "Leave" || record.todayStatus === "Holiday").length,
      icon: "calendar",
      tone: "warning",
    },
    {
      label: "Schedule review",
      value: records.filter((record) => record.hrpsStatus === "Needs Review").length,
      icon: "warning",
      tone: "danger",
    },
  ];

  return (
    <section className="hr-schedules-summary" aria-label="Employee schedule summary">
      {metrics.map((metric) => (
        <article className={`hr-schedules-summary-card hr-schedules-summary-card-${metric.tone}`} key={metric.label}>
          <div className="hr-schedules-summary-icon" aria-hidden="true">
            <Icon name={metric.icon} />
          </div>
          <div className="hr-schedules-summary-copy">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}
