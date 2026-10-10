import { StatusBadge } from "@/components/ui/StatusBadge";
import type {
  AttendanceReportCorrectionRecord,
  AttendanceReportRecord,
  AttendanceReportType,
  MonthlyAttendanceRow,
} from "@/data/hr-attendance-reports";

type AttendanceReportTableProps = {
  reportType: AttendanceReportType;
  records: readonly AttendanceReportRecord[];
  monthlyRows: readonly MonthlyAttendanceRow[];
  correctionRequests: readonly AttendanceReportCorrectionRecord[];
};

function correctionTone(status: AttendanceReportCorrectionRecord["status"]) {
  if (status === "Approved") return "success" as const;
  if (status === "Rejected") return "danger" as const;
  return "warning" as const;
}

function SourceBadge() {
  return <StatusBadge tone="info">QR</StatusBadge>;
}

function EmptyReportRow({ columns }: { columns: number }) {
  return (
    <tr>
      <td colSpan={columns} className="hr-reports-empty-row">
        No attendance records match the selected filters.
      </td>
    </tr>
  );
}

function AttendanceRows({ records }: { records: readonly AttendanceReportRecord[] }) {
  return (
    <>
      {records.map((record) => (
        <tr key={record.id}>
          <td>
            <strong>{record.employeeName}</strong>
            <span className="hr-reports-cell-meta">{record.employeeId}</span>
          </td>
          <td>{record.department}</td>
          <td>{record.dateLabel}</td>
          <td>{record.timeIn}</td>
          <td className={record.timeOut === null ? "hr-reports-missing-value" : undefined}>
            {record.timeOut ?? "Not recorded"}
          </td>
          <td><SourceBadge /></td>
          <td>
            <StatusBadge tone={record.statusTone}>{record.status}</StatusBadge>
          </td>
        </tr>
      ))}
      {records.length === 0 ? <EmptyReportRow columns={8} /> : null}
    </>
  );
}

export function AttendanceReportTable({
  reportType,
  records,
  monthlyRows,
  correctionRequests,
}: AttendanceReportTableProps) {
  if (reportType === "monthly") {
    return (
      <div className="hr-reports-table-scroll">
        <table className="hr-reports-table">
          <caption className="sr-only">Monthly employee attendance summary</caption>
          <thead>
            <tr>
              <th scope="col">Employee</th>
              <th scope="col">Department</th>
              <th scope="col">Attendance records</th>
              <th scope="col">Completed</th>
              <th scope="col">Awaiting time-out</th>
              <th scope="col">QR records</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRows.map((row) => (
              <tr key={row.employeeId}>
                <td>
                  <strong>{row.employeeName}</strong>
                  <span className="hr-reports-cell-meta">{row.employeeId}</span>
                </td>
                <td>{row.department}</td>
                <td>{row.attendanceRecords}</td>
                <td>{row.completed}</td>
                <td>{row.awaitingTimeOut}</td>
                <td>{row.qrRecords}</td>
              </tr>
            ))}
            {monthlyRows.length === 0 ? <EmptyReportRow columns={6} /> : null}
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
          <thead>
            <tr>
              <th scope="col">Request</th>
              <th scope="col">Employee</th>
              <th scope="col">Attendance date</th>
              <th scope="col">Issue</th>
              <th scope="col">Submitted</th>
              <th scope="col">Status</th>
              <th scope="col">Decision date</th>
            </tr>
          </thead>
          <tbody>
            {correctionRequests.map((request) => (
              <tr key={request.id}>
                <td>
                  <strong>{request.id}</strong>
                  <span className="hr-reports-cell-meta">{request.attendanceRecordId}</span>
                </td>
                <td>
                  <strong>{request.employeeName}</strong>
                  <span className="hr-reports-cell-meta">
                    {request.employeeId} · {request.department}
                  </span>
                </td>
                <td>{request.attendanceDateLabel}</td>
                <td>{request.issueType}</td>
                <td>{request.submittedAt}</td>
                <td>
                  <StatusBadge tone={correctionTone(request.status)}>
                    {request.status}
                  </StatusBadge>
                </td>
                <td>{request.decisionAt ?? "Not decided"}</td>
              </tr>
            ))}
            {correctionRequests.length === 0 ? <EmptyReportRow columns={7} /> : null}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="hr-reports-table-scroll">
      <table className="hr-reports-table">
        <caption className="sr-only">
          {reportType === "missing-time-out"
            ? "Attendance records awaiting time-out"
            : "Employee attendance report"}
        </caption>
        <thead>
          <tr>
            <th scope="col">Employee</th>
            <th scope="col">Department</th>
            <th scope="col">Date</th>
            <th scope="col">Time in</th>
            <th scope="col">Time out</th>
            <th scope="col">Source</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <AttendanceRows records={records} />
        </tbody>
      </table>
    </div>
  );
}
