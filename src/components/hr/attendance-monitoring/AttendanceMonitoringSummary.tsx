import { Icon } from "@/components/ui/Icon";
import type { AttendanceMonitoringSummary as AttendanceMonitoringSummaryData } from "@/types/hr-attendance-monitoring";
import type { IconName, StatusTone } from "@/types/ui";

type AttendanceMonitoringSummaryProps = {
    summary: AttendanceMonitoringSummaryData;
};

type SummaryMetric = {
    label: string;
    value: number;
    icon: IconName;
    tone: StatusTone;
};

export function AttendanceMonitoringSummary({ summary }: AttendanceMonitoringSummaryProps) {
    const metrics: SummaryMetric[] = [
        { label: "Total records", value: summary.total, icon: "activity", tone: "info" },
        { label: "Present", value: summary.present, icon: "check", tone: "success" },
        { label: "Completed", value: summary.completed, icon: "check", tone: "info" },
        { label: "Awaiting Time-Out", value: summary.awaitingTimeOut, icon: "clock", tone: "warning" },
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
