import { Icon } from "@/components/ui/Icon";
import type { AttendanceAuditEvent } from "@/data/hr-attendance-audit";
import type { IconName, StatusTone } from "@/types/ui";

type AuditHistorySummaryProps = {
  events: readonly AttendanceAuditEvent[];
};

type SummaryMetric = {
  label: string;
  value: number;
  icon: IconName;
  tone: StatusTone;
};

export function AuditHistorySummary({ events }: AuditHistorySummaryProps) {
  const metrics: SummaryMetric[] = [
    {
      label: "Total activities",
      value: events.length,
      icon: "audit",
      tone: "info",
    },
    {
      label: "Attendance verified",
      value: events.filter((event) => event.action === "Attendance Verified").length,
      icon: "check",
      tone: "success",
    },
    {
      label: "Corrections approved",
      value: events.filter((event) => event.action === "Correction Approved").length,
      icon: "check",
      tone: "success",
    },
    {
      label: "Corrections rejected",
      value: events.filter((event) => event.action === "Correction Rejected").length,
      icon: "close",
      tone: "danger",
    },
    {
      label: "Information requested",
      value: events.filter((event) => event.action === "Information Requested").length,
      icon: "help",
      tone: "warning",
    },
  ];

  return (
    <section className="hr-audit-summary" aria-label="Audit activity summary">
      {metrics.map((metric) => (
        <article className={`hr-audit-summary-card hr-audit-summary-card-${metric.tone}`} key={metric.label}>
          <span className="hr-audit-summary-icon" aria-hidden="true">
            <Icon name={metric.icon} />
          </span>
          <span className="hr-audit-summary-copy">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </span>
        </article>
      ))}
    </section>
  );
}
