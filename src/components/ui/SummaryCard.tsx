import type { Metric } from "@/types/ui";

import { Icon } from "./Icon";

type SummaryCardProps = Metric & {
  detail?: string;
};

export function SummaryCard({ label, value, note, icon, tone, detail }: SummaryCardProps) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-icon-${tone}`}>
        <Icon name={icon} />
      </div>
      <div className="metric-content">
        <p className="metric-label">{label}</p>
        <p className="metric-value">{value}</p>
        <p className="metric-note">{detail ?? note}</p>
      </div>
    </article>
  );
}
