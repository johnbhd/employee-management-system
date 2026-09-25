import { Icon } from "@/components/ui/Icon";
import type { HrAttendanceMonitoringRecord } from "@/data/hr";
import type { IconName, StatusTone } from "@/types/ui";

type AttendanceMonitoringSummaryProps = {
  records: readonly HrAttendanceMonitoringRecord[];
};

type SummaryMetric = {
  label: string;
  value: number;
  icon: IconName;
  tone: StatusTone;
};

export function AttendanceMonitoringSummary({ records }: AttendanceMonitoringSummaryProps) {
  const metrics: SummaryMetric[] = [
    {
      label: "Present",
      value: records.filter((record) => record.status === "Present").length,
      icon: "check",
      tone: "success",
    },
    {
      label: "Late",
      value: records.filter((record) => record.status === "Late").length,
      icon: "clock",
      tone: "warning",
    },
    {
      label: "Absent",
      value: records.filter((record) => record.status === "Absent").length,
      icon: "close",
      tone: "danger",
    },
    {
      label: "Missing Time-Out",
      value: records.filter((record) => record.status === "Missing Time-Out").length,
      icon: "warning",
      tone: "warning",
    },
    {
      label: "Needs Review",
      value: records.filter((record) => record.validationStatus !== "Verified").length,
      icon: "filter",
      tone: "info",
    },
  ];

  return (
    <section className="hr-monitoring-summary" aria-label="Filtered attendance overview">
      {metrics.map((metric) => (
        <article className={`hr-monitoring-summary-card hr-monitoring-summary-card-${metric.tone}`} key={metric.label}>
          <span className="hr-monitoring-summary-icon" aria-hidden="true">
            <Icon name={metric.icon} />
          </span>
          <span className="hr-monitoring-summary-copy">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </span>
        </article>
      ))}
    </section>
  );
}
