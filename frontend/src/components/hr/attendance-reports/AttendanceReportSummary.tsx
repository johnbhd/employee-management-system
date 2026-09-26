import { Icon } from "@/components/ui/Icon";
import type { HrCorrectionRequest } from "@/data/hr-correction-requests";
import {
  buildCorrectionSummary,
  buildSourceUsageSummary,
  type AttendanceReportRecord,
  type AttendanceReportType,
  type MonthlyAttendanceRow,
} from "@/data/hr-attendance-reports";
import type { IconName, StatusTone } from "@/types/ui";

type AttendanceReportSummaryProps = {
  reportType: AttendanceReportType;
  records: readonly AttendanceReportRecord[];
  monthlyRows: readonly MonthlyAttendanceRow[];
  correctionRequests: readonly HrCorrectionRequest[];
};

type ReportMetric = {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: StatusTone;
};

function uniqueEmployeeCount(records: readonly AttendanceReportRecord[]) {
  return new Set(records.map((record) => record.employeeId)).size;
}

function totalMinutes(records: readonly AttendanceReportRecord[], field: "lateMinutes" | "undertimeMinutes") {
  return records.reduce((total, record) => total + (record[field] ?? 0), 0);
}

function metricsForReport({ reportType, records, monthlyRows, correctionRequests }: AttendanceReportSummaryProps): ReportMetric[] {
  if (reportType === "monthly") {
    return [
      { label: "Employees included", value: String(monthlyRows.length), note: "Unique employees", icon: "users", tone: "info" },
      { label: "Scheduled days", value: String(monthlyRows.reduce((total, row) => total + row.scheduledDays, 0)), note: "Records in period", icon: "calendar", tone: "muted" },
      { label: "Present records", value: String(monthlyRows.reduce((total, row) => total + row.present, 0)), note: "Attendance marked present", icon: "check", tone: "success" },
      { label: "Late records", value: String(monthlyRows.reduce((total, row) => total + row.late, 0)), note: "Attendance marked late", icon: "clock", tone: "warning" },
      { label: "Absent records", value: String(monthlyRows.reduce((total, row) => total + row.absent, 0)), note: "Attendance marked absent", icon: "close", tone: "danger" },
      { label: "HR verified", value: String(records.filter((record) => record.hrVerificationStatus === "Verified").length), note: "Final HR verification", icon: "check", tone: "success" },
      { label: "Ready for payroll", value: String(records.filter((record) => record.payrollReadiness === "Ready for Payroll").length), note: "Eligible for handoff", icon: "activity", tone: "info" },
    ];
  }

  if (reportType === "late") {
    const minutes = totalMinutes(records, "lateMinutes");
    return [
      { label: "Employees late", value: String(uniqueEmployeeCount(records)), note: "Unique employees", icon: "users", tone: "warning" },
      { label: "Late records", value: String(records.length), note: "Records in period", icon: "clock", tone: "warning" },
      { label: "Late minutes", value: String(minutes), note: "Recorded minutes", icon: "clock", tone: "danger" },
      { label: "Average late", value: records.length ? `${Math.round(minutes / records.length)} min` : "0 min", note: "Per late record", icon: "activity", tone: "muted" },
    ];
  }

  if (reportType === "undertime") {
    const minutes = totalMinutes(records, "undertimeMinutes");
    return [
      { label: "Employees with undertime", value: String(uniqueEmployeeCount(records)), note: "Unique employees", icon: "users", tone: "warning" },
      { label: "Undertime records", value: String(records.length), note: "Records with values", icon: "clock", tone: "warning" },
      { label: "Undertime minutes", value: String(minutes), note: "Recorded minutes", icon: "clock", tone: "danger" },
      { label: "Average undertime", value: records.length ? `${Math.round(minutes / records.length)} min` : "0 min", note: "Per undertime record", icon: "activity", tone: "muted" },
    ];
  }

  if (reportType === "missing-time-out") {
    const submitted = records.filter((record) => record.correctionRequestId).length;
    const needsReview = records.filter((record) => record.validationStatus === "Needs Review" || record.correctionStatus === "Under Review").length;
    const resolved = records.filter((record) => record.correctionStatus === "Approved" || record.correctionStatus === "Rejected").length;
    return [
      { label: "Missing time-outs", value: String(records.length), note: "Records in period", icon: "warning", tone: "warning" },
      { label: "Correction submitted", value: String(submitted), note: "Linked correction requests", icon: "comment", tone: "info" },
      { label: "Needs review", value: String(needsReview), note: "Validation or HR review", icon: "activity", tone: "warning" },
      { label: "Resolved", value: String(resolved), note: "Approved or rejected", icon: "check", tone: "success" },
    ];
  }

  if (reportType === "source-usage") {
    const sourceSummary = buildSourceUsageSummary(records);
    return [
      { label: "Bundy records", value: String(sourceSummary.bundy), note: "Source identified", icon: "bundy", tone: "muted" },
      { label: "QR records", value: String(sourceSummary.qr), note: "Source identified", icon: "qr", tone: "info" },
      { label: "Total records", value: String(sourceSummary.total), note: "Included in report", icon: "layers", tone: "success" },
      { label: "Source conflicts", value: String(sourceSummary.sourceConflicts), note: "Needs reconciliation", icon: "warning", tone: sourceSummary.sourceConflicts ? "warning" : "success" },
    ];
  }

  if (reportType === "correction-summary") {
    const summary = buildCorrectionSummary(correctionRequests);
    return [
      { label: "Total requests", value: String(summary.total), note: "Submitted corrections", icon: "comment", tone: "info" },
      { label: "Open requests", value: String(summary.open), note: "Not yet resolved", icon: "activity", tone: summary.open ? "warning" : "success" },
      { label: "Approved", value: String(summary.approved), note: "Review completed", icon: "check", tone: "success" },
      { label: "Rejected", value: String(summary.rejected), note: "Review completed", icon: "close", tone: summary.rejected ? "danger" : "muted" },
      { label: "Needs information", value: String(summary.needsInformation), note: "Employee follow-up", icon: "help", tone: summary.needsInformation ? "warning" : "muted" },
    ];
  }

  return [
    { label: "Records", value: String(records.length), note: "Included in report", icon: "layers", tone: "info" },
    { label: "Present", value: String(records.filter((record) => record.status === "Present").length), note: "Attendance marked present", icon: "check", tone: "success" },
    { label: "Late", value: String(records.filter((record) => record.status === "Late").length), note: "Attendance marked late", icon: "clock", tone: "warning" },
    { label: "Absent", value: String(records.filter((record) => record.status === "Absent").length), note: "Attendance marked absent", icon: "close", tone: "danger" },
    { label: "Missing time-out", value: String(records.filter((record) => record.status === "Missing Time-Out").length), note: "Open attendance gaps", icon: "warning", tone: "warning" },
    { label: "HR verified", value: String(records.filter((record) => record.hrVerificationStatus === "Verified").length), note: "Final HR verification", icon: "check", tone: "success" },
    { label: "Ready for payroll", value: String(records.filter((record) => record.payrollReadiness === "Ready for Payroll").length), note: "Eligible for handoff", icon: "activity", tone: "info" },
    { label: "Pending verification", value: String(records.filter((record) => record.hrVerificationStatus !== "Verified").length), note: "Needs final HR review", icon: "activity", tone: "warning" },
  ];
}

export function AttendanceReportSummary(props: AttendanceReportSummaryProps) {
  const metrics = metricsForReport(props);

  return (
    <div className="hr-reports-summary" aria-label="Report summary">
      {metrics.map((metric) => (
        <article className="hr-reports-summary-card" key={metric.label}>
          <span className={`hr-reports-summary-icon status-${metric.tone}`}><Icon name={metric.icon} /></span>
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
