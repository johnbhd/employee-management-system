import { StatusBadge } from "@/components/ui/StatusBadge";
import type { HrCorrectionRequest } from "@/data/hr-correction-requests";
import type { AttendanceReportRecord, AttendanceReportType, MonthlyAttendanceRow } from "@/data/hr-attendance-reports";

type AttendanceReportTableProps = {
  reportType: AttendanceReportType;
  records: readonly AttendanceReportRecord[];
  monthlyRows: readonly MonthlyAttendanceRow[];
  correctionRequests: readonly HrCorrectionRequest[];
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function sourceTone(source: AttendanceReportRecord["source"]) {
  if (source === "QR") return "info" as const;
  if (source === "Bundy") return "muted" as const;
  return "danger" as const;
}

function correctionTone(status: HrCorrectionRequest["status"]) {
  if (status === "Approved") return "success" as const;
  if (status === "Rejected") return "danger" as const;
  if (status === "Needs Additional Information") return "warning" as const;
  return "info" as const;
}

function SourceBadge({ source }: { source: AttendanceReportRecord["source"] }) {
  return source ? <StatusBadge tone={sourceTone(source)}>{source}</StatusBadge> : <span className="hr-reports-missing-value">No source</span>;
}

function EmptyReportRow({ columns }: { columns: number }) {
  return (
    <tr>
      <td colSpan={columns} className="hr-reports-empty-row">No report records match the selected filters.</td>
    </tr>
  );
}

export function AttendanceReportTable({ reportType, records, monthlyRows, correctionRequests }: AttendanceReportTableProps) {
  if (reportType === "monthly") {
    return (
      <div className="hr-reports-table-scroll">
        <table className="hr-reports-table">
          <caption className="sr-only">Monthly employee attendance summary</caption>
          <thead><tr><th scope="col">Employee</th><th scope="col">Department</th><th scope="col">Scheduled days</th><th scope="col">Present</th><th scope="col">Late</th><th scope="col">Absent</th><th scope="col">Undertime</th><th scope="col">Missing time-out</th></tr></thead>
          <tbody>
            {monthlyRows.map((row) => (
              <tr key={row.employeeId}>
                <td><strong>{row.employeeName}</strong><span className="hr-reports-cell-meta">{row.employeeId}</span></td>
                <td>{row.department}</td><td>{row.scheduledDays}</td><td>{row.present}</td><td>{row.late}</td><td>{row.absent}</td><td>{row.undertimeMinutes ? `${row.undertimeMinutes} min` : "—"}</td><td>{row.missingTimeOut}</td>
              </tr>
            ))}
            {monthlyRows.length === 0 ? <EmptyReportRow columns={8} /> : null}
          </tbody>
        </table>
      </div>
    );
  }

  if (reportType === "correction-summary") {
    return (
      <div className="hr-reports-table-scroll">
        <table className="hr-reports-table">
          <caption className="sr-only">Attendance correction request summary</caption>
          <thead><tr><th scope="col">Request</th><th scope="col">Employee</th><th scope="col">Attendance date</th><th scope="col">Issue</th><th scope="col">Submitted</th><th scope="col">Status</th><th scope="col">Decision date</th></tr></thead>
          <tbody>
            {correctionRequests.map((request) => (
              <tr key={request.id}>
                <td><strong>{request.id}</strong><span className="hr-reports-cell-meta">{request.attendanceRecordId}</span></td><td><strong>{request.employeeName}</strong><span className="hr-reports-cell-meta">{request.employeeId} · {request.department}</span></td><td>{formatDate(request.attendanceDate)}</td><td>{request.issueType}</td><td>{formatDate(request.submittedDate)}</td><td><StatusBadge tone={correctionTone(request.status)}>{request.status}</StatusBadge></td><td>{request.decisionAt ?? "Not decided"}</td>
              </tr>
            ))}
            {correctionRequests.length === 0 ? <EmptyReportRow columns={7} /> : null}
          </tbody>
        </table>
      </div>
    );
  }

  if (reportType === "late") {
    return (
      <div className="hr-reports-table-scroll">
        <table className="hr-reports-table">
          <caption className="sr-only">Late attendance report</caption>
          <thead><tr><th scope="col">Employee</th><th scope="col">Department</th><th scope="col">Date</th><th scope="col">Schedule</th><th scope="col">Time in</th><th scope="col">Late minutes</th><th scope="col">Source</th><th scope="col">Validation</th></tr></thead>
          <tbody>{records.map((record) => <tr key={record.id}><td><strong>{record.employeeName}</strong><span className="hr-reports-cell-meta">{record.employeeId}</span></td><td>{record.department}</td><td>{formatDate(record.date)}</td><td>{record.schedule}</td><td>{record.timeIn}</td><td>{record.lateMinutes ? `${record.lateMinutes} min` : "—"}</td><td><SourceBadge source={record.source} /></td><td><StatusBadge tone={record.validationTone}>{record.validationStatus}</StatusBadge></td></tr>)}{records.length === 0 ? <EmptyReportRow columns={8} /> : null}</tbody>
        </table>
      </div>
    );
  }

  if (reportType === "undertime") {
    return (
      <div className="hr-reports-table-scroll">
        <table className="hr-reports-table">
          <caption className="sr-only">Undertime attendance report</caption>
          <thead><tr><th scope="col">Employee</th><th scope="col">Department</th><th scope="col">Date</th><th scope="col">Schedule</th><th scope="col">Time out</th><th scope="col">Undertime minutes</th><th scope="col">Source</th><th scope="col">Validation</th></tr></thead>
          <tbody>{records.map((record) => <tr key={record.id}><td><strong>{record.employeeName}</strong><span className="hr-reports-cell-meta">{record.employeeId}</span></td><td>{record.department}</td><td>{formatDate(record.date)}</td><td>{record.schedule}</td><td>{record.timeOut}</td><td>{record.undertimeMinutes ? `${record.undertimeMinutes} min` : "—"}</td><td><SourceBadge source={record.source} /></td><td><StatusBadge tone={record.validationTone}>{record.validationStatus}</StatusBadge></td></tr>)}{records.length === 0 ? <EmptyReportRow columns={8} /> : null}</tbody>
        </table>
      </div>
    );
  }

  if (reportType === "missing-time-out") {
    return (
      <div className="hr-reports-table-scroll">
        <table className="hr-reports-table">
          <caption className="sr-only">Missing time-out attendance report</caption>
          <thead><tr><th scope="col">Employee</th><th scope="col">Department</th><th scope="col">Date</th><th scope="col">Schedule</th><th scope="col">Time in</th><th scope="col">Source</th><th scope="col">Validation</th><th scope="col">Correction status</th></tr></thead>
          <tbody>{records.map((record) => <tr key={record.id}><td><strong>{record.employeeName}</strong><span className="hr-reports-cell-meta">{record.employeeId}</span></td><td>{record.department}</td><td>{formatDate(record.date)}</td><td>{record.schedule}</td><td>{record.timeIn}</td><td><SourceBadge source={record.source} /></td><td><StatusBadge tone={record.validationTone}>{record.validationStatus}</StatusBadge></td><td>{record.correctionStatus ? <StatusBadge tone={correctionTone(record.correctionStatus)}>{record.correctionStatus}</StatusBadge> : <span className="hr-reports-missing-value">Not submitted</span>}</td></tr>)}{records.length === 0 ? <EmptyReportRow columns={8} /> : null}</tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="hr-reports-table-scroll">
      <table className="hr-reports-table">
        <caption className="sr-only">Daily employee attendance report</caption>
        <thead><tr><th scope="col">Employee</th><th scope="col">Department</th><th scope="col">Schedule</th><th scope="col">Time in</th><th scope="col">Time out</th><th scope="col">Source</th><th scope="col">Status</th><th scope="col">Validation</th></tr></thead>
        <tbody>{records.map((record) => <tr key={record.id}><td><strong>{record.employeeName}</strong><span className="hr-reports-cell-meta">{record.employeeId}</span></td><td>{record.department}</td><td>{record.schedule}</td><td className={record.timeIn === "—" ? "hr-reports-missing-value" : undefined}>{record.timeIn}</td><td className={record.timeOut === "—" ? "hr-reports-missing-value" : undefined}>{record.timeOut}</td><td><SourceBadge source={record.source} /></td><td><StatusBadge tone={record.statusTone}>{record.status}</StatusBadge></td><td><StatusBadge tone={record.validationTone}>{record.validationStatus}</StatusBadge></td></tr>)}{records.length === 0 ? <EmptyReportRow columns={8} /> : null}</tbody>
      </table>
    </div>
  );
}
