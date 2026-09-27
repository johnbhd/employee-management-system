import type { HrSummaryMetric } from "@/data/hr";

import { Icon } from "@/components/ui/Icon";

type HrAttendanceSummaryProps = {
  metrics: readonly HrSummaryMetric[];
};

export function HrAttendanceSummary({ metrics }: HrAttendanceSummaryProps) {
  return (
    <section className="hr-dashboard-summary" aria-label="Attendance summary">
      {metrics.map((metric) => (
        <article className={`hr-summary-card hr-summary-card-${metric.tone}`} key={metric.label}>
          <div className="hr-summary-icon" aria-hidden="true">
            <Icon name={metric.icon} />
          </div>
          <div className="hr-summary-copy">
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.note}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
