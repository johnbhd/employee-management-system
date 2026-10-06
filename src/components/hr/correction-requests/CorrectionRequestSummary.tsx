import { Icon } from "@/components/ui/Icon";
import type { AttendanceCorrectionData } from "@/types/attendance-correction";
import type { IconName, StatusTone } from "@/types/ui";

type CorrectionRequestSummaryProps = {
  summary: AttendanceCorrectionData["summary"];
};

type SummaryMetric = {
  label: string;
  value: number;
  icon: IconName;
  tone: StatusTone;
};

export function CorrectionRequestSummary({ summary }: CorrectionRequestSummaryProps) {
  const metrics: SummaryMetric[] = [
    {
      label: "Pending review",
      value: summary.pending,
      icon: "clock",
      tone: "info",
    },
    {
      label: "Approved",
      value: summary.approved,
      icon: "check",
      tone: "success",
    },
    {
      label: "Rejected",
      value: summary.rejected,
      icon: "close",
      tone: "danger",
    },
  ];

  return (
    <section className="hr-correction-summary" aria-label="Correction request overview">
      {metrics.map((metric) => (
        <article
          className={`hr-correction-summary-card hr-correction-summary-card-${metric.tone}`}
          key={metric.label}
        >
          <span className="hr-correction-summary-icon" aria-hidden="true">
            <Icon name={metric.icon} />
          </span>
          <span className="hr-correction-summary-copy">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </span>
        </article>
      ))}
    </section>
  );
}
