import { Icon } from "@/components/ui/Icon";
import type { HrAuditHistorySummary } from "@/types/hr-audit-history";
import type { IconName, StatusTone } from "@/types/ui";

type AuditHistorySummaryProps = {
  summary: HrAuditHistorySummary;
};

type SummaryMetric = {
  label: string;
  value: number;
  icon: IconName;
  tone: StatusTone;
};

export function AuditHistorySummary({ summary }: AuditHistorySummaryProps) {
  const metrics: SummaryMetric[] = [
    { label: "Total activities", value: summary.total, icon: "audit", tone: "info" },
    { label: "Attendance actions", value: summary.attendance, icon: "check", tone: "success" },
    { label: "QR actions", value: summary.qr, icon: "qr", tone: "info" },
    { label: "Corrections approved", value: summary.approved, icon: "check", tone: "success" },
    { label: "Corrections rejected", value: summary.rejected, icon: "close", tone: "danger" },
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
