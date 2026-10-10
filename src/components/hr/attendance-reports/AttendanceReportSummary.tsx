import { Icon } from "@/components/ui/Icon";
import {
  buildCorrectionSummary,
  type AttendanceReportCorrectionRecord,
  type AttendanceReportSummary as AttendanceReportSummaryData,
  type AttendanceReportType,
  type MonthlyAttendanceRow,
} from "@/data/hr-attendance-reports";
import type { IconName, StatusTone } from "@/types/ui";

type AttendanceReportSummaryProps = {
  reportType: AttendanceReportType;
  summary: AttendanceReportSummaryData;
  monthlyRows: readonly MonthlyAttendanceRow[];
  correctionRequests: readonly AttendanceReportCorrectionRecord[];
};

type ReportMetric = {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: StatusTone;
};

function metricsForReport({
  reportType,
  summary,
  monthlyRows,
  correctionRequests,
}: AttendanceReportSummaryProps): ReportMetric[] {
  if (reportType === "monthly") {
    return [
      {
        label: "Employees included",
        value: String(monthlyRows.length),
        note: "Unique employees",
        icon: "users",
        tone: "info",
      },
      {
        label: "Attendance records",
        value: String(summary.totalRecords),
        note: "Records in period",
        icon: "layers",
        tone: "muted",
      },
      {
        label: "Completed",
        value: String(summary.completed),
        note: "Time in and time out recorded",
        icon: "check",
        tone: "success",
      },
      {
        label: "Awaiting time-out",
        value: String(summary.awaitingTimeOut),
        note: "Time out not recorded",
        icon: "clock",
        tone: summary.awaitingTimeOut ? "warning" : "success",
      },
    ];
  }

  if (reportType === "correction-summary") {
    const correctionSummary = buildCorrectionSummary(correctionRequests);

    return [
      {
        label: "Total requests",
        value: String(correctionRequests.length),
        note: "Requests in period",
        icon: "comment",
        tone: "info",
      },
      {
        label: "Pending",
        value: String(correctionSummary.pending),
        note: "Awaiting HR decision",
        icon: "activity",
        tone: correctionSummary.pending ? "warning" : "success",
      },
      {
        label: "Approved",
        value: String(correctionSummary.approved),
        note: "Review completed",
        icon: "check",
        tone: "success",
      },
      {
        label: "Rejected",
        value: String(correctionSummary.rejected),
        note: "Review completed",
        icon: "close",
        tone: correctionSummary.rejected ? "danger" : "muted",
      },
    ];
  }

  return [
    {
      label: "Total records",
      value: String(summary.totalRecords),
      note: "Matching attendance records",
      icon: "layers",
      tone: "info",
    },
    {
      label: "Timed in",
      value: String(summary.timedIn),
      note: "Time in recorded",
      icon: "check",
      tone: "success",
    },
    {
      label: "Completed",
      value: String(summary.completed),
      note: "Time in and time out recorded",
      icon: "check",
      tone: "success",
    },
    {
      label: "Awaiting time-out",
      value: String(summary.awaitingTimeOut),
      note: "Time out not recorded",
      icon: "clock",
      tone: summary.awaitingTimeOut ? "warning" : "success",
    },
  ];
}

export function AttendanceReportSummary(props: AttendanceReportSummaryProps) {
  const metrics = metricsForReport(props);

  return (
    <div className="hr-reports-summary" aria-label="Report summary">
      {metrics.map((metric) => (
        <article className="hr-reports-summary-card" key={metric.label}>
          <span className={`hr-reports-summary-icon status-${metric.tone}`} aria-hidden="true">
            <Icon name={metric.icon} />
          </span>
          <div>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </div>
        </article>
      ))}
    </div>
  );
}
