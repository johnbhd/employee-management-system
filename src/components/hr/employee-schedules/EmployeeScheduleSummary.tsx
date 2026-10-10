import { Icon } from "@/components/ui/Icon";
import type { IconName, StatusTone } from "@/types/ui";

import type { EmployeeScheduleItem } from "@/types/hr-employee-schedule";

type EmployeeScheduleSummaryProps = {
  records: readonly EmployeeScheduleItem[];
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
      value: records.filter((record) => record.schedule !== null).length,
      icon: "calendar",
      tone: "info",
    },
    {
      label: "No schedule reference",
      value: records.filter((record) => record.schedule === null).length,
      icon: "warning",
      tone: "warning",
    },
    {
      label: "Active employees",
      value: records.filter((record) => record.employee.employmentStatus === "active").length,
      icon: "check",
      tone: "success",
    },
    {
      label: "Departments",
      value: new Set(records.map((record) => record.employee.department)).size,
      icon: "users",
      tone: "muted",
    },
  ];

  return (
    <section className="hr-schedules-summary" aria-label="Employee schedule summary">
      {metrics.map((metric) => (
        <article
          className={`hr-schedules-summary-card hr-schedules-summary-card-${metric.tone}`}
          key={metric.label}
        >
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
