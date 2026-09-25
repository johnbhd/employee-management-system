import { Icon } from "@/components/ui/Icon";
import type { HrCorrectionRequest } from "@/data/hr-correction-requests";
import type { IconName, StatusTone } from "@/types/ui";

type CorrectionRequestSummaryProps = {
  requests: readonly HrCorrectionRequest[];
};

type SummaryMetric = {
  label: string;
  value: number;
  icon: IconName;
  tone: StatusTone;
};

const decisionDate = "Sep 16, 2026";

export function CorrectionRequestSummary({ requests }: CorrectionRequestSummaryProps) {
  const metrics: SummaryMetric[] = [
    {
      label: "Pending Review",
      value: requests.filter((request) => ["Submitted", "Under Review"].includes(request.status)).length,
      icon: "clock",
      tone: "info",
    },
    {
      label: "Needs Information",
      value: requests.filter((request) => request.status === "Needs Additional Information").length,
      icon: "comment",
      tone: "warning",
    },
    {
      label: "Approved Today",
      value: requests.filter((request) => request.status === "Approved" && request.decisionAt?.startsWith(decisionDate)).length,
      icon: "check",
      tone: "success",
    },
    {
      label: "Rejected Today",
      value: requests.filter((request) => request.status === "Rejected" && request.decisionAt?.startsWith(decisionDate)).length,
      icon: "close",
      tone: "danger",
    },
  ];

  return (
    <section className="hr-correction-summary" aria-label="Correction request overview">
      {metrics.map((metric) => (
        <article className={`hr-correction-summary-card hr-correction-summary-card-${metric.tone}`} key={metric.label}>
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
